import fs from 'node:fs';
import path from 'node:path';
import type { Db } from './types';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const SEED_PATH = path.join(DATA_DIR, 'db.seed.json');

// Windows retries: OneDrive / antivirus / search indexers briefly hold files
// with an exclusive lock, which makes readFileSync/writeFileSync throw
// EBUSY/EPERM/EACCES. Retry those transient errors with a small backoff.
const RETRYABLE_CODES = new Set(['EBUSY', 'EPERM', 'EACCES', 'ELOCKED', 'EMFILE', 'ENFILE']);

function retryOnLock<T>(fn: () => T): T {
  let lastErr: any;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      return fn();
    } catch (err: any) {
      lastErr = err;
      if (!err?.code || !RETRYABLE_CODES.has(err.code)) throw err;
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
  };
}

export function readDb(): Db {
  // Vercel's runtime filesystem is read-only. Use the committed seed directly
  // when no local writable database exists instead of bootstrapping a copy.
  const sourcePath = fs.existsSync(DB_PATH) ? DB_PATH : SEED_PATH;
  const raw = retryOnLock(() =>
    fs.existsSync(sourcePath) ? fs.readFileSync(sourcePath, 'utf-8') : JSON.stringify(emptyDb())
  );
  const parsed = JSON.parse(raw);
  return { ...emptyDb(), ...parsed };
}

export function writeDb(db: Db): void {
  // Write to a temp file then rename, so readers never observe a partially
  // written database and transient exclusive locks can be retried.
  const tmpPath = `${DB_PATH}.tmp`;
  retryOnLock(() => fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2)));
  retryOnLock(() => fs.renameSync(tmpPath, DB_PATH));
}

/** Read, mutate in place, persist, return whatever the mutator returns. */
export function updateDb<T>(mutator: (db: Db) => T): T {
  const db = readDb();
  const result = mutator(db);
  writeDb(db);
  return result;
}

export function resetDbToSeed(): void {
  if (fs.existsSync(SEED_PATH)) {
    fs.copyFileSync(SEED_PATH, DB_PATH);
  }
}

let counter = 0;
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
