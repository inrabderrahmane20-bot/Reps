import fs from 'node:fs';
import path from 'node:path';
import { rootCertificates } from 'node:tls';
import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';
import type { Db, Session, User } from './types';

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  providers: number;
  verifiedProviders: number;
  pendingProviders: number;
  serviceRequests: number;
  completedMissions: number;
  communities: number;
  activities: number;
  meetingProfiles: number;
  chatRooms: number;
  newsArticles: number;
  openReports: number;
  bannedUsers: number;
}

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const SEED_PATH = path.join(DATA_DIR, 'db.seed.json');
// Supabase's database/pooler certificates are signed by a private CA that is
// not in Node's default trust store. Keep the pinned copy in the repository so
// production keeps certificate verification enabled without extra setup.
const BUNDLED_CA_PATH = path.join(process.cwd(), 'supabase', 'prod-ca-2021.crt');
const RETRYABLE_CODES = new Set(['EBUSY', 'EPERM', 'EACCES', 'ELOCKED', 'EMFILE', 'ENFILE']);

// Connection-level failures that are worth retrying. Supabase's pooler can
// briefly reject connections while a project wakes up or while it is at its
// connection limit; a single retry usually succeeds and avoids a 500 in the
// admin panel.
const TRANSIENT_DB_CODES = new Set([
  '57P03', // cannot_connect_now (database starting up)
  '53300', // too_many_connections
  '53400', // configuration_limit_exceeded
  '08000', // connection_exception
  '08001', // unable_to_establish_connection
  '08003', // connection_does_not_exist
  '08004', // connection_rejected
  '08006', // connection_failure
  '08007', // transaction_resolution_unknown
  '08P01', // protocol_violation
  'XX000', // Supabase pooler can return internal_error for transient failures.
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'ETIMEDOUT',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'EPIPE',
  'EAI_AGAIN',
]);
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
  postgresCategoryCache?: {
    categories: Db['categories'];
    categoryTreeInitialized: boolean;
    version: string;
    loadedAt: number;
  };
  postgresAdminStatsCache?: {
    stats: AdminStats;
    version: string;
    loadedAt: number;
  };
  mediaTableReady?: boolean;
  mediaTablePromise?: Promise<void>;
};
const APP_META_VERSION_KEY = 'dbVersion';
const DB_CACHE_MAX_AGE_MS = 5 * 60_000;
// If PostgreSQL is briefly unreachable, a recent snapshot is still much more
// useful than an empty admin page. Keep serving it for a bounded period.
const DB_CACHE_STALE_FALLBACK_MS = 30 * 60_000;
const ADMIN_STATS_STALE_FALLBACK_MS = 10 * 60_000;

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientDbError(error: unknown): boolean {
  const candidate = error as { code?: string; message?: string } | undefined;
  if (candidate?.code && TRANSIENT_DB_CODES.has(candidate.code)) return true;
  const message = candidate?.message ?? '';
  return /timeout exceeded when trying to connect|connection terminated|connection timeout|server closed the connection unexpectedly|client has encountered a connection error|connection reset|socket hang up/i.test(
    message
  );
}

/**
 * Run a read query with a short retry loop. The pg pool discards broken
 * clients, so a retry normally gets a fresh connection from the pooler.
 * Never use this inside an open transaction: a broken connection aborts the
 * transaction and a retry cannot recover it.
 */
async function queryWithRetry<T extends QueryResultRow = QueryResultRow>(
  client: Pool | PoolClient,
  text: string,
  values?: unknown[],
  attempts = 3
): Promise<QueryResult<T>> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return values
        ? await client.query<T>(text, values as any[])
        : await client.query<T>(text);
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1 || !isTransientDbError(error)) throw error;
      await sleep(150 * 2 ** attempt + Math.floor(Math.random() * 100));
    }
  }
  throw lastError;
}

async function connectWithRetry(pool: Pool, attempts = 3): Promise<PoolClient> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await pool.connect();
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1 || !isTransientDbError(error)) throw error;
      await sleep(200 * 2 ** attempt + Math.floor(Math.random() * 100));
    }
  }
  throw lastError;
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
  client: Pool | PoolClient,
  attempts = 3
): Promise<{ db: Db; version: string }> {
  try {
    const result = await queryWithRetry<{
      db: Partial<Db>;
      initialized: unknown;
      version: unknown;
    }>(
      client,
      `SELECT jsonb_build_object(${COLLECTION_JSON_FIELDS}) AS db,
              COALESCE((SELECT value FROM public.app_meta WHERE key = 'categoryTreeInitialized'), 'false'::jsonb) AS initialized,
              COALESCE((SELECT value FROM public.app_meta WHERE key = '${APP_META_VERSION_KEY}'), '0'::jsonb) AS version`,
      undefined,
      attempts
    );
    const db: Db = { ...emptyDb(), ...result.rows[0].db };
    db.categoryTreeInitialized = Boolean(result.rows[0].initialized);
    return { db, version: String(result.rows[0].version ?? '0') };
  } catch (error) {
    throwDatabaseError(error);
  }
}

async function readPostgresDb(client: Pool | PoolClient): Promise<Db> {
  // Used inside write transactions, where a retry cannot recover an aborted
  // transaction.
  return (await readPostgresDbSnapshot(client, 1)).db;
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
      const result = await queryWithRetry<{ version: unknown }>(
        pool,
        `SELECT COALESCE((SELECT value FROM public.app_meta WHERE key = $1), '0'::jsonb) AS version`,
        [APP_META_VERSION_KEY],
        2
      );
      if (String(result.rows[0].version ?? '0') === cached.version) {
        return structuredClone(cached.db);
      }
    } catch (error) {
      // A missing app_meta table is handled by the full read below. If the
      // database is only temporarily unreachable, serve the recent snapshot.
      if (isTransientDbError(error)) return structuredClone(cached.db);
      if ((error as { code?: string }).code !== '42P01') throw error;
    }
  }

  try {
    const snapshot = await readPostgresDbSnapshot(pool);
    globalForDb.postgresDbCache = {
      db: structuredClone(snapshot.db),
      version: snapshot.version,
      loadedAt: Date.now(),
    };
    return snapshot.db;
  } catch (error) {
    if (
      cached &&
      isTransientDbError(error) &&
      Date.now() - cached.loadedAt < DB_CACHE_STALE_FALLBACK_MS
    ) {
      console.warn('Serving the cached database snapshot because PostgreSQL is temporarily unreachable.');
      return structuredClone(cached.db);
    }
    throw error;
  }
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

  const cached = globalForDb.postgresCategoryCache;

  try {
    const result = await queryWithRetry<{
      categories: Db['categories'];
      initialized: unknown;
      version: unknown;
    }>(
      pool,
      `SELECT COALESCE((SELECT jsonb_agg(data ORDER BY record_key) FROM public."categories"), '[]'::jsonb) AS categories,
              COALESCE((SELECT value FROM public.app_meta WHERE key = 'categoryTreeInitialized'), 'false'::jsonb) AS initialized,
              COALESCE((SELECT value FROM public.app_meta WHERE key = $1), '0'::jsonb) AS version`,
      [APP_META_VERSION_KEY]
    );

    const version = String(result.rows[0].version ?? '0');
    if (
      cached &&
      cached.version === version &&
      Date.now() - cached.loadedAt < DB_CACHE_MAX_AGE_MS
    ) {
      return {
        categories: structuredClone(cached.categories),
        categoryTreeInitialized: cached.categoryTreeInitialized,
      };
    }

    const state = {
      categories: result.rows[0].categories ?? [],
      categoryTreeInitialized: Boolean(result.rows[0].initialized),
    };
    globalForDb.postgresCategoryCache = {
      ...state,
      version,
      loadedAt: Date.now(),
    };
    return state;
  } catch (error) {
    if (
      cached &&
      isTransientDbError(error) &&
      Date.now() - cached.loadedAt < DB_CACHE_STALE_FALLBACK_MS
    ) {
      console.warn('Serving the cached category tree because PostgreSQL is temporarily unreachable.');
      return {
        categories: structuredClone(cached.categories),
        categoryTreeInitialized: cached.categoryTreeInitialized,
      };
    }
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
    const result = await queryWithRetry<{ data: User }>(
      pool,
      `SELECT data FROM public.users WHERE data->>'role' = 'admin' ORDER BY record_key LIMIT 1`
    );
    return result.rows[0]?.data ?? null;
  } catch (error) {
    throwDatabaseError(error);
  }
}

function countAdminStats(db: Db): AdminStats {
  return {
    totalUsers: db.users.length,
    activeUsers: db.users.filter((user) => user.status === 'active').length,
    providers: db.users.filter((user) => user.provider).length,
    verifiedProviders: db.users.filter((user) => user.providerStatus === 'approved').length,
    pendingProviders: db.users.filter((user) => user.providerStatus === 'pending').length,
    serviceRequests: db.serviceRequests.length,
    completedMissions: db.serviceRequests.filter((request) => request.status === 'completed').length,
    communities: db.communities.length,
    activities: db.activities.length,
    meetingProfiles: db.meetingProfiles.length,
    chatRooms: db.rooms.length,
    newsArticles: db.news.length,
    openReports: db.reports.filter((report) => report.status === 'new' || report.status === 'under_review').length,
    bannedUsers: db.users.filter((user) => user.status === 'banned').length,
  };
}

/**
 * Calculate dashboard counts in PostgreSQL instead of transferring and
 * deserializing every collection for a handful of totals.
 */
export async function readAdminStats(): Promise<AdminStats> {
  const pool = getPool();
  if (!pool) return countAdminStats(readLocalDb());

  const cached = globalForDb.postgresAdminStatsCache;
  try {
    if (cached && Date.now() - cached.loadedAt < DB_CACHE_MAX_AGE_MS) {
      const currentVersion = await queryWithRetry<{ version: unknown }>(
        pool,
        `SELECT COALESCE((SELECT value #>> '{}' FROM public.app_meta WHERE key = $1), '0') AS version`,
        [APP_META_VERSION_KEY],
        2
      );
      if (String(currentVersion.rows[0].version ?? '0') === cached.version) {
        return { ...cached.stats };
      }
    }

    const result = await queryWithRetry<AdminStats & { version: unknown }>(
      pool,
      `SELECT
         (SELECT COUNT(*)::int FROM public.users) AS "totalUsers",
         (SELECT COUNT(*) FILTER (WHERE data->>'status' = 'active')::int FROM public.users) AS "activeUsers",
         (SELECT COUNT(*) FILTER (
            WHERE data->'provider' IS NOT NULL AND data->'provider' <> 'null'::jsonb
          )::int FROM public.users) AS providers,
         (SELECT COUNT(*) FILTER (WHERE data->>'providerStatus' = 'approved')::int FROM public.users) AS "verifiedProviders",
         (SELECT COUNT(*) FILTER (WHERE data->>'providerStatus' = 'pending')::int FROM public.users) AS "pendingProviders",
         (SELECT COUNT(*)::int FROM public."serviceRequests") AS "serviceRequests",
         (SELECT COUNT(*) FILTER (WHERE data->>'status' = 'completed')::int FROM public."serviceRequests") AS "completedMissions",
         (SELECT COUNT(*)::int FROM public.communities) AS communities,
         (SELECT COUNT(*)::int FROM public.activities) AS activities,
         (SELECT COUNT(*)::int FROM public."meetingProfiles") AS "meetingProfiles",
         (SELECT COUNT(*)::int FROM public.rooms) AS "chatRooms",
         (SELECT COUNT(*)::int FROM public.news) AS "newsArticles",
         (SELECT COUNT(*) FILTER (WHERE data->>'status' IN ('new', 'under_review'))::int FROM public.reports) AS "openReports",
         (SELECT COUNT(*) FILTER (WHERE data->>'status' = 'banned')::int FROM public.users) AS "bannedUsers",
         COALESCE((SELECT value #>> '{}' FROM public.app_meta WHERE key = $1), '0') AS version`,
      [APP_META_VERSION_KEY],
      2
    );
    const { version, ...stats } = result.rows[0];
    globalForDb.postgresAdminStatsCache = {
      stats,
      version: String(version ?? '0'),
      loadedAt: Date.now(),
    };
    return stats;
  } catch (error) {
    if (
      cached &&
      isTransientDbError(error) &&
      Date.now() - cached.loadedAt < ADMIN_STATS_STALE_FALLBACK_MS
    ) {
      console.warn('Serving cached admin stats because PostgreSQL is temporarily unavailable.');
      return { ...cached.stats };
    }
    if ((error as { code?: string }).code === '42P01') {
      throwDatabaseError(error);
    }
    if (error && typeof error === 'object') {
      Object.assign(error, { operation: 'admin_stats' });
    }
    throw error;
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
    const result = await queryWithRetry<{ session: Session; user: User | null }>(
      pool,
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

  const client = await connectWithRetry(pool);
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(492813198234)');
    const previous = await readPostgresDb(client);
    const version = await persistDbDiff(client, previous, db);
    await client.query('COMMIT');
    globalForDb.postgresDbCache = { db: structuredClone(db), version, loadedAt: Date.now() };
    globalForDb.postgresCategoryCache = {
      categories: structuredClone(db.categories),
      categoryTreeInitialized: Boolean(db.categoryTreeInitialized),
      version,
      loadedAt: Date.now(),
    };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // The connection is already broken; surface the original error.
    }
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

  const client = await connectWithRetry(pool);
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(492813198234)');
    const db = await readPostgresDb(client);
    const previous = structuredClone(db);
    const result = mutator(db);
    const version = await persistDbDiff(client, previous, db);
    await client.query('COMMIT');
    globalForDb.postgresDbCache = { db: structuredClone(db), version, loadedAt: Date.now() };
    globalForDb.postgresCategoryCache = {
      categories: structuredClone(db.categories),
      categoryTreeInitialized: Boolean(db.categoryTreeInitialized),
      version,
      loadedAt: Date.now(),
    };
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // The connection is already broken; surface the original error.
    }
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

/* ------------------------------------------------------------------ */
/* Uploaded media (category photos)                                    */
/* ------------------------------------------------------------------ */
/*
 * Vercel functions run on a read-only filesystem, so admin image uploads
 * cannot be written to `public/`. On a configured Postgres database we store
 * the bytes in `public.media_uploads` and serve them through
 * `/api/uploads/categories/[filename]`. Local development without a database
 * keeps using the filesystem fallback in the upload route.
 */

export interface StoredMedia {
  mime: string;
  data: Buffer;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

async function ensureMediaTable(pool: Pool): Promise<void> {
  if (globalForDb.mediaTableReady) return;
  if (!globalForDb.mediaTablePromise) {
    globalForDb.mediaTablePromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS public.media_uploads (
          id text PRIMARY KEY,
          mime text NOT NULL,
          data bytea NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `);
      // Match the hardened permissions used by the application collections.
      // These are best-effort so local databases without Supabase roles still work.
      try {
        await pool.query('ALTER TABLE public.media_uploads ENABLE ROW LEVEL SECURITY');
        await pool.query('REVOKE ALL ON TABLE public.media_uploads FROM anon, authenticated');
        await pool.query('GRANT ALL ON TABLE public.media_uploads TO service_role');
      } catch {
        /* Supabase-specific roles are absent on plain Postgres installs. */
      }
      globalForDb.mediaTableReady = true;
    })().finally(() => {
      globalForDb.mediaTablePromise = undefined;
    });
  }
  await globalForDb.mediaTablePromise;
}

export async function saveUploadedImage(input: {
  id: string;
  mime: string;
  data: Buffer;
}): Promise<void> {
  const pool = getPool();
  if (!pool) throw new Error('The application database is not configured.');
  await ensureMediaTable(pool);
  await pool.query(
    `INSERT INTO public.media_uploads (id, mime, data)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET mime = EXCLUDED.mime, data = EXCLUDED.data`,
    [input.id, input.mime, input.data]
  );
}

export async function readUploadedImage(id: string): Promise<StoredMedia | null> {
  const pool = getPool();
  if (!pool) return null;
  await ensureMediaTable(pool);
  const result = await pool.query<{ mime: string; data: Buffer }>(
    'SELECT mime, data FROM public.media_uploads WHERE id = $1 LIMIT 1',
    [id]
  );
  const row = result.rows[0];
  if (!row) return null;
  return { mime: row.mime, data: row.data };
}

// Visual Editor documents are isolated from application/auth records.
let visualEditorSchema: Promise<void> | undefined;
async function ensureVisualEditorTable(pool: Pool): Promise<void> {
  if (!visualEditorSchema) visualEditorSchema = (async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS public.visual_editor_documents (
      id text PRIMARY KEY, data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    await pool.query('ALTER TABLE public.visual_editor_documents ENABLE ROW LEVEL SECURITY');
    await pool.query(`DO $permissions$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN REVOKE ALL ON public.visual_editor_documents FROM anon; END IF;
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN REVOKE ALL ON public.visual_editor_documents FROM authenticated; END IF;
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN GRANT ALL ON public.visual_editor_documents TO service_role; END IF;
    END $permissions$`);
  })().catch(error => { visualEditorSchema = undefined; throw error; });
  await visualEditorSchema;
}
function visualEditorPath(id: string): string {
  if (!/^(navbar|footer|services|home|privacy|terms|rules)-(en|fr|ar)$/.test(id)) throw new Error('Invalid visual document key.');
  return path.join(DATA_DIR, 'visual-editor', `${id}.json`);
}
export async function readVisualEditorRecord<T>(id: string): Promise<T | null> {
  const file = visualEditorPath(id);
  const pool = getPool();
  if (pool) {
    await ensureVisualEditorTable(pool);
    const result = await queryWithRetry<{ data: T }>(pool, 'SELECT data FROM public.visual_editor_documents WHERE id = $1', [id]);
    return result.rows[0]?.data ?? null;
  }
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) as T; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error; }
}
export async function mutateVisualEditorRecord<T>(id: string, mutate: (current: T | null) => T): Promise<T> {
  const file = visualEditorPath(id);
  const pool = getPool();
  if (pool) {
    await ensureVisualEditorTable(pool);
    const client = await connectWithRetry(pool);
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`visual-editor:${id}`]);
      const result = await client.query<{ data: T }>('SELECT data FROM public.visual_editor_documents WHERE id = $1 FOR UPDATE', [id]);
      const next = mutate(result.rows[0]?.data ?? null);
      await client.query('INSERT INTO public.visual_editor_documents (id,data) VALUES ($1,$2::jsonb) ON CONFLICT (id) DO UPDATE SET data=EXCLUDED.data, updated_at=now()', [id, JSON.stringify(next)]);
      await client.query('COMMIT');
      return next;
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  let lock: number | undefined;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { lock = fs.openSync(`${file}.lock`, 'wx'); break; }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; await sleep(20); }
  }
  if (lock === undefined) throw new Error('Document is busy. Please retry.');
  const temporary = `${file}.${process.pid}.tmp`;
  try {
    let current: T | null = null;
    try { current = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    const next = mutate(current);
    fs.writeFileSync(temporary, JSON.stringify(next, null, 2));
    retryOnLock(() => fs.renameSync(temporary, file));
    return next;
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    fs.closeSync(lock);
    fs.unlinkSync(`${file}.lock`);
  }
}

// Anonymous, aggregate category-search counters. Kept separate from account/category records.
let categorySearchSchema: Promise<void> | undefined;
async function ensureCategorySearchSchema(pool: Pool) {
  categorySearchSchema ??= pool.query(`CREATE TABLE IF NOT EXISTS public.category_search_counts (id text PRIMARY KEY, searches bigint NOT NULL DEFAULT 0, updated_at timestamptz NOT NULL DEFAULT now()); ALTER TABLE public.category_search_counts ENABLE ROW LEVEL SECURITY; DO $p$ BEGIN IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON public.category_search_counts FROM anon; END IF; IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON public.category_search_counts FROM authenticated; END IF; IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN GRANT ALL ON public.category_search_counts TO service_role; END IF; END $p$;`).then(()=>{}).catch(error=>{categorySearchSchema=undefined;throw error;});
  await categorySearchSchema;
}
const CATEGORY_SEARCH_PATH = path.join(process.cwd(),'.local-data','category-searches.json');
export async function readCategorySearchCounts(): Promise<Record<string,number>> {
  const pool=getPool();
  if (pool) {
    await ensureCategorySearchSchema(pool);
    const result=await queryWithRetry<{id:string;searches:string}>(pool,'SELECT id, searches FROM public.category_search_counts');
    return Object.fromEntries(result.rows.map(row=>[row.id,Number(row.searches)]));
  }
  try {return JSON.parse(fs.readFileSync(CATEGORY_SEARCH_PATH,'utf8'));}
  catch(error) {if((error as NodeJS.ErrnoException).code==='ENOENT') return {};throw error;}
}
export async function incrementCategorySearchCount(id:string): Promise<void> {
  const pool=getPool();
  if(pool) {
    await ensureCategorySearchSchema(pool);
    await queryWithRetry(pool,'INSERT INTO public.category_search_counts (id,searches) VALUES ($1,1) ON CONFLICT (id) DO UPDATE SET searches=category_search_counts.searches+1,updated_at=now()',[id]);
    return;
  }
  fs.mkdirSync(path.dirname(CATEGORY_SEARCH_PATH),{recursive:true});
  let lock:number|undefined;
  for(let attempt=0;attempt<100;attempt++) {
    try {lock=fs.openSync(`${CATEGORY_SEARCH_PATH}.lock`,'wx');break;}
    catch(error) {if((error as NodeJS.ErrnoException).code!=='EEXIST') throw error;await sleep(20);}
  }
  if(lock===undefined) throw new Error('Category statistics are busy.');
  const temporary=`${CATEGORY_SEARCH_PATH}.${process.pid}.tmp`;
  try {
    const counts=await readCategorySearchCounts();counts[id]=(counts[id]??0)+1;
    fs.writeFileSync(temporary,JSON.stringify(counts));fs.renameSync(temporary,CATEGORY_SEARCH_PATH);
  } finally {fs.closeSync(lock);fs.rmSync(`${CATEGORY_SEARCH_PATH}.lock`,{force:true});fs.rmSync(temporary,{force:true});}
}
