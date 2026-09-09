import fs from 'node:fs';
import path from 'node:path';
import type { Db } from './types';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const SEED_PATH = path.join(DATA_DIR, 'db.seed.json');

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

function ensureDb(): void {
  if (fs.existsSync(DB_PATH)) return;
  if (fs.existsSync(SEED_PATH)) {
    fs.copyFileSync(SEED_PATH, DB_PATH);
  } else {
    fs.writeFileSync(DB_PATH, JSON.stringify(emptyDb(), null, 2));
  }
}

export function readDb(): Db {
  ensureDb();
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  const parsed = JSON.parse(raw);
  return { ...emptyDb(), ...parsed };
}

export function writeDb(db: Db): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
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
