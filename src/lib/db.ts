import fs from 'node:fs';
import path from 'node:path';
import { rootCertificates } from 'node:tls';
import { Pool, type PoolClient } from 'pg';
import type { Db } from './types';

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

const globalForDb = globalThis as typeof globalThis & { postgresPool?: Pool };

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

async function readPostgresDb(client: Pool | PoolClient): Promise<Db> {
  try {
    const result = await client.query<{ db: Partial<Db> }>(
      `SELECT jsonb_build_object(${COLLECTION_JSON_FIELDS}) AS db`
    );
    const db = { ...emptyDb(), ...result.rows[0].db };
    const initialized = await client.query<{ value: boolean }>(
      'SELECT value FROM public.app_meta WHERE key = $1',
      ['categoryTreeInitialized']
    );
    if (initialized.rowCount) db.categoryTreeInitialized = initialized.rows[0].value;
    return db;
  } catch (error) {
    if ((error as { code?: string }).code === '42P01') {
      throw new Error('Supabase tables are not initialized. Run "npm run db:migrate" before deploying.');
    }
    throw error;
  }
}

function collectionMap(collection: DbCollection, db: Db): Map<string, DbRecord> {
  const records = db[collection] as unknown as DbRecord[];
  return new Map(records.map((record) => [recordKey(collection, record), record]));
}

async function persistDbDiff(client: PoolClient, previous: Db, next: Db): Promise<void> {
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
}

export async function readDb(): Promise<Db> {
  const pool = getPool();
  return pool ? readPostgresDb(pool) : readLocalDb();
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
    await persistDbDiff(client, previous, db);
    await client.query('COMMIT');
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
    await persistDbDiff(client, previous, db);
    await client.query('COMMIT');
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
