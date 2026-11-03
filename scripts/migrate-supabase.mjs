import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvConfig } from '@next/env';
import pg from 'pg';

const { Pool } = pg;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
loadEnvConfig(root);
const connectionString =
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;
const ca = process.env.POSTGRES_CA_CERT?.replace(/\\n/g, '\n');

if (!connectionString) {
  throw new Error('Set POSTGRES_PRISMA_URL (or POSTGRES_URL) before running this migration.');
}

function getPoolOptions() {
  if (!ca) return { connectionString };

  const url = new URL(connectionString);
  for (const parameter of ['sslmode', 'sslrootcert', 'sslcert', 'sslkey']) {
    url.searchParams.delete(parameter);
  }

  return {
    connectionString: url.toString(),
    ssl: { ca, rejectUnauthorized: true },
  };
}

const collections = [
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
];

const keyField = {
  sessions: 'token',
  meetingProfiles: 'userId',
};

const sourcePath = path.join(root, 'src', 'data', 'db.json');
const seedPath = path.join(root, 'src', 'data', 'db.seed.json');
const migrationPath = path.join(
  root,
  'supabase',
  'migrations',
  '202611030001_create_app_data.sql'
);
const source = JSON.parse(fs.readFileSync(fs.existsSync(sourcePath) ? sourcePath : seedPath, 'utf8'));
const pool = new Pool({ ...getPoolOptions(), max: 1, connectionTimeoutMillis: 10_000 });

try {
  await pool.query(fs.readFileSync(migrationPath, 'utf8'));
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(492813198234)');
    for (const collection of collections) {
      const records = source[collection] ?? [];
      const field = keyField[collection] ?? 'id';
      for (let offset = 0; offset < records.length; offset += 250) {
        const batch = records.slice(offset, offset + 250).map((record) => {
          const recordKey = record[field];
          if (typeof recordKey !== 'string' || !recordKey) {
            throw new Error(`Invalid ${field} in ${collection} at record ${offset + 1}.`);
          }
          return { record_key: recordKey, data: record };
        });
        if (!batch.length) continue;
        await client.query(
          `INSERT INTO public."${collection}" (record_key, data)
           SELECT incoming.record_key, incoming.data
           FROM jsonb_to_recordset($1::jsonb) AS incoming(record_key text, data jsonb)
           ON CONFLICT (record_key) DO NOTHING`,
          [JSON.stringify(batch)]
        );
      }
      console.log(`${collection}: imported ${records.length} source records (existing rows preserved).`);
    }

    await client.query(
      `INSERT INTO public.app_meta (key, value)
       VALUES ('categoryTreeInitialized', $1::jsonb)
       ON CONFLICT (key) DO NOTHING`,
      [JSON.stringify(Boolean(source.categoryTreeInitialized))]
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  console.log('Supabase schema and initial data migration completed.');
} finally {
  await pool.end();
}
