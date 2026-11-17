import { secureRoute } from '@/lib/security/route';
import { NextRequest, NextResponse } from 'next/server';
import { listClientSearches, recordClientSearch } from '@/lib/client-searches';

export const dynamic = 'force-dynamic';

// Recent client searches that did not find an exact service match.
//   GET  /api/client-searches          -> { searches: ClientSearchEntry[] }
//   POST /api/client-searches          -> body { query } ; returns the list
async function handleGET() {
  return NextResponse.json({ searches: listClientSearches() });
}

async function handlePOST(req: NextRequest) {
  let body: { query?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // fall through to the validation below
  }
  const query = typeof body?.query === 'string' ? body.query.trim() : '';
  if (query.length < 2) {
    return NextResponse.json({ error: 'query_too_short' }, { status: 400 });
  }
  recordClientSearch(query);
  return NextResponse.json({ searches: listClientSearches() });
}
export const GET = secureRoute(handleGET);
export const POST = secureRoute(handlePOST);
