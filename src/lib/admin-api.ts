// Server-only helpers shared by the admin API routes.
//
// Kept out of `lib/marketing-validation.ts` on purpose: that module is pure
// TypeScript so the admin UI can run the exact same rules in the browser,
// while this one imports `next/server` and the session helpers.

import { NextResponse } from 'next/server';
import { getSessionUser } from './auth';
import { jsonError } from './api-helpers';
import type { MarketingIssue } from './marketing-validation';

/**
 * 401/403 for anybody who is not an administrator. `requireAdmin()` only
 * guarantees that an administrator account exists — the caller still has to
 * prove it with a session.
 */
export function requireAdminSession(): NextResponse | null {
  const session = getSessionUser();
  if (!session) return jsonError('You must be signed in.', 401);
  if (session.role !== 'admin') return jsonError('Administrator access is required.', 403);
  return null;
}

/** 400 + the first offending field, so the admin UI can point at it. */
export function marketingError(issues: MarketingIssue[]): NextResponse {
  const first = issues[0] ?? { field: '', message: 'Invalid marketing data.' };
  return NextResponse.json(
    { error: first.message, field: first.field, issues },
    { status: 400 }
  );
}
