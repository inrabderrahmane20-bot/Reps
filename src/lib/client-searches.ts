// "Recherche client" — recent client searches that did not find an exact
// service match. Kept in memory on purpose: Vercel's runtime filesystem is
// read-only, so a JSON-DB write could not persist there. The store is seeded
// with a few plausible examples so the section is demonstrable, then fed by
// the Services page whenever a query returns zero results.
//
// Server-only module (imported by route handlers); it must never be imported
// by client components.

export interface ClientSearchEntry {
  /** The query the client typed (trimmed). */
  query: string;
  /** ISO timestamp of the most recent time this query was recorded. */
  createdAt: string;
}

const MAX_ENTRIES = 24;

// Seed entries chosen to have no exact match in the seeded data (verified
// against the providers API). They represent clients looking for services that
// the marketplace does not cover yet.
const SEED: ClientSearchEntry[] = [
  { query: 'pisciniste', createdAt: '2026-09-19T09:12:00.000Z' },
  { query: 'traducteur juridique', createdAt: '2026-09-18T16:40:00.000Z' },
  { query: 'coiffeur', createdAt: '2026-09-18T11:05:00.000Z' },
  { query: 'réparation climatiseur', createdAt: '2026-09-17T14:30:00.000Z' },
];

let entries: ClientSearchEntry[] = [...SEED];

/** Record a client search, moving existing duplicates to the front. */
export function recordClientSearch(query: string): ClientSearchEntry[] {
  const trimmed = query.trim();
  if (trimmed.length < 2) return listClientSearches();

  const now = new Date().toISOString();
  const existing = entries.find((e) => e.query.toLowerCase() === trimmed.toLowerCase());
  if (existing) {
    existing.createdAt = now;
    entries = [existing, ...entries.filter((e) => e !== existing)];
  } else {
    entries.unshift({ query: trimmed, createdAt: now });
  }
  entries = entries.slice(0, MAX_ENTRIES);
  // Keep the seed entries when the store empties.
  return listClientSearches();
}

/** Most recent client searches, newest first. */
export function listClientSearches(limit = 10): ClientSearchEntry[] {
  return entries.slice(0, limit);
}