import fs from 'node:fs';
import path from 'node:path';
import { rootCertificates } from 'node:tls';
import { Pool, type PoolClient } from 'pg';
import type { Db, Session, User } from './types';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const SEED_PATH = path.join(DATA_DIR, 'db.seed.json');
// Supabase's database/pooler certificates are signed by a private CA that is
// not in Node's default trust store. Keep the pinned copy in the repository so
// production keeps certificate verification enabled without extra setup.
const BUNDLED_CA_PATH = path.join(process.cwd(), 'supabase', 'prod-ca-2021.crt');
const RETRYABLE_CODES = new Set(['EBUSY', 'EPERM', 'EACCES', 'ELOCKED', 'EMFILE', 'ENFILE']);
const DB_COLLECTIONS = [
  'users',
  'sessions',
  'serviceRequests',
  'reviews',
  'news',
  'communities',
  'communityPosts',
  'activities',
  'meetingProfiles',
  'meetingRequests',
  'conversations',
  'messages',
  'rooms',
  'roomMessages',
  'notifications',
  'reports',
  'favorites',
  'invitations',
  'savedSearches',
  'categories',
  'places',
  'listings',
] as const satisfies readonly (keyof Db)[];
type DbCollection = (typeof DB_COLLECTIONS)[number];
type DbRecord = Record<string, unknown>;

const globalForDb = globalThis as typeof globalThis & {
  postgresPool?: Pool;
  postgresDbCache?: { db: Db; version: string; loadedAt: number };
};
const APP_META_VERSION_KEY = 'dbVersion';
const DB_CACHE_MAX_AGE_MS = 5 * 60_000;

function retryOnLock<T>(fn: () => T): T {
  let lastErr: NodeJS.ErrnoException | undefined;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      return fn();
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      lastErr = error;
      if (!error.code || !RETRYABLE_CODES.has(error.code)) throw error;
      const buffer = new Int32Array(new SharedArrayBuffer(4));
      Atomics.wait(buffer, 0, 0, 25 * (attempt + 1) * (attempt + 1));
    }
  }
  throw lastErr;
}

function emptyDb(): Db {
  return {
    users: [],
    sessions: [],
    serviceRequests: [],
    reviews: [],
    news: [],
    communities: [],
    communityPosts: [],
    activities: [],
    meetingProfiles: [],
    meetingRequests: [],
    conversations: [],
    messages: [],
    rooms: [],
    roomMessages: [],
    notifications: [],
    reports: [],
    favorites: [],
    invitations: [],
    savedSearches: [],
    categories: [],
    categoryTreeInitialized: false,
    places: [],
    listings: [],
  };
}

function getDatabaseUrl(): string | undefined {
  return (
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL
  );
}

function getPostgresCa(): string | undefined {
  const fromEnvironment = process.env.POSTGRES_CA_CERT?.replace(/\\n/g, '\n').trim();
  if (fromEnvironment) return fromEnvironment;

  try {
    return fs.readFileSync(BUNDLED_CA_PATH, 'utf-8').trim();
  } catch {
    return undefined;
  }
}

function getPostgresPoolOptions(connectionString: string) {
  const ca = getPostgresCa();
  if (!ca) return { connectionString };

  const url = new URL(connectionString);
  for (const parameter of ['sslmode', 'sslrootcert', 'sslcert', 'sslkey']) {
    url.searchParams.delete(parameter);
  }

  return {
    connectionString: url.toString(),
    // Include the public roots as well so a non-Supabase database still works.
    ssl: { ca: [...rootCertificates, ca], rejectUnauthorized: true },
  };
}

function getPool(): Pool | null {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    if (process.env.VERCEL) {
      throw new Error('Configure POSTGRES_PRISMA_URL in Vercel before using the application database.');
    }
    return null;
  }

  if (!globalForDb.postgresPool) {
    const pool = new Pool({
      ...getPostgresPoolOptions(connectionString),
      max: 4,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
      // Fail fast instead of letting a request hang until the platform timeout.
      statement_timeout: 25_000,
      query_timeout: 30_000,
      lock_timeout: 10_000,
      idle_in_transaction_session_timeout: 30_000,
    });
    pool.on('error', (error) => console.error('Unexpected PostgreSQL pool error.', error));
    globalForDb.postgresPool = pool;
  }
  return globalForDb.postgresPool;
}

function readLocalDb(): Db {
  const sourcePath = fs.existsSync(DB_PATH) ? DB_PATH : SEED_PATH;
  const raw = retryOnLock(() =>
    fs.existsSync(sourcePath) ? fs.readFileSync(sourcePath, 'utf-8') : JSON.stringify(emptyDb())
  );
  return { ...emptyDb(), ...JSON.parse(raw) };
}

function recordKey(collection: DbCollection, record: DbRecord): string {
  const value = collection === 'sessions'
    ? record.token
    : collection === 'meetingProfiles'
      ? record.userId
      : record.id;
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`A record in "${collection}" is missing its stable key.`);
  }
  return value;
}

const COLLECTION_JSON_FIELDS = DB_COLLECTIONS
  .map((collection) => `'${collection}', COALESCE((SELECT jsonb_agg(data ORDER BY record_key) FROM public."${collection}"), '[]'::jsonb)`)
  .join(', ');

function throwDatabaseError(error: unknown): never {
  if ((error as { code?: string }).code === '42P01') {
    throw new Error('Supabase tables are not initialized. Run "npm run db:migrate" before deploying.');
  }
  throw error;
}

async function readPostgresDbSnapshot(
  client: Pool | PoolClient
): Promise<{ db: Db; version: string }> {
  try {
    const result = await client.query<{ db: Partial<Db>; initialized: unknown; version: unknown }>(
      `SELECT jsonb_build_object(${COLLECTION_JSON_FIELDS}) AS db,
              COALESCE((SELECT value FROM public.app_meta WHERE key = 'categoryTreeInitialized'), 'false'::jsonb) AS initialized,
              COALESCE((SELECT value FROM public.app_meta WHERE key = '${APP_META_VERSION_KEY}'), '0'::jsonb) AS version`
    );
    const db: Db = { ...emptyDb(), ...result.rows[0].db };
    db.categoryTreeInitialized = Boolean(result.rows[0].initialized);
    return { db, version: String(result.rows[0].version ?? '0') };
  } catch (error) {
    throwDatabaseError(error);
  }
}

async function readPostgresDb(client: Pool | PoolClient): Promise<Db> {
  return (await readPostgresDbSnapshot(client)).db;
}

/**
 * Reuse the last full snapshot for this server instance unless the database
 * changed. The version check is one tiny query, which avoids transferring the
 * whole JSON database on every page/API request.
 */
async function readCachedPostgresDb(pool: Pool): Promise<Db> {
  const cached = globalForDb.postgresDbCache;
  if (cached && Date.now() - cached.loadedAt < DB_CACHE_MAX_AGE_MS) {
    try {
      const result = await pool.query<{ version: unknown }>(
        `SELECT COALESCE((SELECT value FROM public.app_meta WHERE key = $1), '0'::jsonb) AS version`,
        [APP_META_VERSION_KEY]
      );
      if (String(result.rows[0].version ?? '0') === cached.version) {
        return structuredClone(cached.db);
      }
    } catch (error) {
      // A missing app_meta table is handled by the full read below.
      if ((error as { code?: string }).code !== '42P01') throw error;
    }
  }

  const snapshot = await readPostgresDbSnapshot(pool);
  globalForDb.postgresDbCache = {
    db: structuredClone(snapshot.db),
    version: snapshot.version,
    loadedAt: Date.now(),
  };
  return snapshot.db;
}

/** Read only the category tree state instead of the whole database. */
export async function readCategoryState(): Promise<{
  categories: Db['categories'];
  categoryTreeInitialized: boolean;
}> {
  const pool = getPool();
  if (!pool) {
    const db = readLocalDb();
    return {
      categories: db.categories,
      categoryTreeInitialized: Boolean(db.categoryTreeInitialized),
    };
  }

  try {
    const result = await pool.query<{ categories: Db['categories']; initialized: unknown }>(
      `SELECT COALESCE((SELECT jsonb_agg(data ORDER BY record_key) FROM public."categories"), '[]'::jsonb) AS categories,
              COALESCE((SELECT value FROM public.app_meta WHERE key = 'categoryTreeInitialized'), 'false'::jsonb) AS initialized`
    );
    return {
      categories: result.rows[0].categories ?? [],
      categoryTreeInitialized: Boolean(result.rows[0].initialized),
    };
  } catch (error) {
    throwDatabaseError(error);
  }
}

/** Find an administrator without loading every collection. */
export async function readAdminUser(): Promise<User | null> {
  const pool = getPool();
  if (!pool) {
    return readLocalDb().users.find((user) => user.role === 'admin') ?? null;
  }

  try {
    const result = await pool.query<{ data: User }>(
      `SELECT data FROM public.users WHERE data->>'role' = 'admin' ORDER BY record_key LIMIT 1`
    );
    return result.rows[0]?.data ?? null;
  } catch (error) {
    throwDatabaseError(error);
  }
}

/** Resolve a session cookie in one query instead of reading the whole database. */
export async function readSessionUser(
  token: string
): Promise<{ session: Session; user: User } | null> {
  const pool = getPool();
  if (!pool) {
    const db = readLocalDb();
    const session = db.sessions.find((item) => item.token === token);
    if (!session) return null;
    const user = db.users.find((item) => item.id === session.userId);
    return user ? { session, user } : null;
  }

  try {
    const result = await pool.query<{ session: Session; user: User | null }>(
      `SELECT s.data AS session, u.data AS user
       FROM public.sessions s
       LEFT JOIN public.users u ON u.record_key = s.data->>'userId'
       WHERE s.record_key = $1`,
      [token]
    );
    const row = result.rows[0];
    if (!row?.session || !row.user) return null;
    return { session: row.session, user: row.user };
  } catch (error) {
    throwDatabaseError(error);
  }
}

function collectionMap(collection: DbCollection, db: Db): Map<string, DbRecord> {
  const records = db[collection] as unknown as DbRecord[];
  return new Map(records.map((record) => [recordKey(collection, record), record]));
}

async function persistDbDiff(client: PoolClient, previous: Db, next: Db): Promise<string> {
  for (const collection of DB_COLLECTIONS) {
    const oldRecords = collectionMap(collection, previous);
    const newRecords = collectionMap(collection, next);
    const changed = [...newRecords]
      .filter(([key, record]) => JSON.stringify(oldRecords.get(key)) !== JSON.stringify(record))
      .map(([record_key, data]) => ({ record_key, data }));
    const removed = [...oldRecords.keys()].filter((key) => !newRecords.has(key));

    if (changed.length) {
      await client.query(
        `INSERT INTO public."${collection}" (record_key, data)
         SELECT incoming.record_key, incoming.data
         FROM jsonb_to_recordset($1::jsonb) AS incoming(record_key text, data jsonb)
         ON CONFLICT (record_key) DO UPDATE SET data = EXCLUDED.data
         WHERE public."${collection}".data IS DISTINCT FROM EXCLUDED.data`,
        [JSON.stringify(changed)]
      );
    }
    if (removed.length) {
      await client.query(
        `DELETE FROM public."${collection}" WHERE record_key = ANY($1::text[])`,
        [removed]
      );
    }
  }

  await client.query(
    `INSERT INTO public.app_meta (key, value)
     VALUES ('categoryTreeInitialized', $1::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [JSON.stringify(Boolean(next.categoryTreeInitialized))]
  );

  const version = await client.query<{ version: unknown }>(
    `INSERT INTO public.app_meta (key, value)
     VALUES ($1, '1'::jsonb)
     ON CONFLICT (key) DO UPDATE
       SET value = to_jsonb(COALESCE((public.app_meta.value #>> '{}')::bigint, 0) + 1)
     RETURNING value AS version`,
    [APP_META_VERSION_KEY]
  );
  return String(version.rows[0].version ?? '1');
}

export async function readDb(): Promise<Db> {
  const pool = getPool();
  return pool ? readCachedPostgresDb(pool) : readLocalDb();
}

export async function writeDb(db: Db): Promise<void> {
  const pool = getPool();
  if (!pool) {
    const tmpPath = `${DB_PATH}.tmp`;
    retryOnLock(() => fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2)));
    retryOnLock(() => fs.renameSync(tmpPath, DB_PATH));
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(492813198234)');
    const previous = await readPostgresDb(client);
    const version = await persistDbDiff(client, previous, db);
    await client.query('COMMIT');
    globalForDb.postgresDbCache = { db: structuredClone(db), version, loadedAt: Date.now() };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/** Read, mutate in place, persist changes, and return the mutator result. */
export async function updateDb<T>(mutator: (db: Db) => T): Promise<T> {
  const pool = getPool();
  if (!pool) {
    const db = readLocalDb();
    const result = mutator(db);
    const tmpPath = `${DB_PATH}.tmp`;
    retryOnLock(() => fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2)));
    retryOnLock(() => fs.renameSync(tmpPath, DB_PATH));
    return result;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(492813198234)');
    const db = await readPostgresDb(client);
    const previous = structuredClone(db);
    const result = mutator(db);
    const version = await persistDbDiff(client, previous, db);
    await client.query('COMMIT');
    globalForDb.postgresDbCache = { db: structuredClone(db), version, loadedAt: Date.now() };
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function resetDbToSeed(): Promise<void> {
  const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf-8')) as Db;
  await writeDb({ ...emptyDb(), ...seed });
}

let counter = 0;
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
