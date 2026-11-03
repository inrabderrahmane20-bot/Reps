# Supabase database

The application stores its existing JSON collections in PostgreSQL tables with
the same names (`users`, `sessions`, `serviceRequests`, `communityPosts`, and
the other collection names in `src/lib/db.ts`). Each table keeps the current
record shape in a `jsonb` column, keyed by its stable application ID. This
preserves the current model while moving reads and writes to persistent storage.

## Configure and migrate

1. Rotate any credentials that were shared outside the Supabase dashboard.
2. Set `POSTGRES_PRISMA_URL` in `.env.local` and in Vercel's server-side
   environment. Use the Supabase PostgreSQL transaction-pooler connection
   string. Do not prefix it with `NEXT_PUBLIC_` or commit its value.
3. `pg` 8.16+ verifies TLS certificates for `sslmode=require`, and Supabase's
   database/pooler certificates are signed by its own CA, which Node does not
   trust by default. This repository pins that CA at
   `supabase/prod-ca-2021.crt`, so no extra configuration is normally needed.
   To override it, set the PEM contents as `POSTGRES_CA_CERT` (either with real
   newlines or escaped as `\n`). Keep certificate verification enabled; do not
   disable TLS certificate checks.
4. Run `npm run db:migrate` once from a machine that has network access to the
   Supabase database. The script creates the tables and imports `src/data/db.json`
   when present, otherwise `src/data/db.seed.json`. Existing rows are preserved;
   the import does not overwrite matching IDs.
5. Deploy the application with the same `POSTGRES_PRISMA_URL` configured in
   Vercel.

The migration is safe to rerun. Runtime writes use database transactions and
persist changed records only. In local development, leaving the connection
string unset keeps the existing `src/data/db.json` behavior.
