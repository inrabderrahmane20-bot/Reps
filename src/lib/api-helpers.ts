import { NextResponse } from 'next/server';

export function jsonError(
  message: string,
  status = 400,
  details?: Record<string, unknown>
) {
  return NextResponse.json(
    { error: message, ...details },
    {
      status,
      // Never let a browser or shared cache keep an error response around
      // after the database has recovered.
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    }
  );
}

const TLS_ERROR_CODES = new Set([
  'SELF_SIGNED_CERT_IN_CHAIN',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'UNABLE_TO_GET_ISSUER_CERT',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'CERT_HAS_EXPIRED',
  'CERT_NOT_YET_VALID',
  'ERR_TLS_CERT_ALTNAME_INVALID',
]);

const DATABASE_ERROR_CODES = new Set([
  '57014', // statement_timeout / query_canceled
  '55P03', // lock_not_available
  '57P01', // admin_shutdown
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
  'XX000', // internal_error (Supabase pooler can report transient failures)
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'ETIMEDOUT',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'EAI_AGAIN',
  'EPIPE',
]);

/** Wrap a route handler body; converts thrown auth errors (with .status) into JSON error responses. */
export async function withErrors(fn: () => Promise<Response> | Response): Promise<Response> {
  try {
    return await fn();
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') return jsonError('You must be signed in.', 401);
    if (err?.message === 'FORBIDDEN') return jsonError('Not allowed.', 403);
    console.error(err);

    const code = typeof err?.code === 'string' ? err.code : undefined;
    // Safe, non-secret diagnostics: these surface in the response body so a
    // production 500 can be identified without access to the server logs.
    const details: Record<string, unknown> = {};
    if (code) details.code = code;
    if (typeof err?.operation === 'string') details.operation = err.operation;
    // `TypeError`/`ReferenceError` point at an application bug rather than a
    // database problem, which is useful when only the response is available.
    if (typeof err?.name === 'string' && err.name !== 'Error') details.type = err.name;

    if (err?.message === 'Supabase tables are not initialized. Run "npm run db:migrate" before deploying.') {
      return jsonError(err.message, 503, details);
    }
    if (err?.message === 'Configure POSTGRES_PRISMA_URL in Vercel before using the application database.') {
      return jsonError(err.message, 503, details);
    }
    if (err?.message === 'No administrator account is configured.') {
      return jsonError(
        'No administrator account is configured. Run the database migration or create an administrator account.',
        503,
        details
      );
    }
    if (code && TLS_ERROR_CODES.has(code)) {
      return jsonError(
        'The database TLS certificate could not be verified. Use the Supabase CA certificate in POSTGRES_CA_CERT, or keep the bundled supabase/prod-ca-2021.crt up to date.',
        503,
        details
      );
    }
    if (code === '28P01') {
      return jsonError('The database rejected its credentials. Check that the rotated POSTGRES_PRISMA_URL in Vercel matches Supabase.', 503, details);
    }
    if (code === 'XX000') {
      return jsonError(
        'Supabase returned an internal database error. The read was retried; check the Vercel Function Log for the PostgreSQL message and operation.',
        503,
        details
      );
    }
    if (code && DATABASE_ERROR_CODES.has(code)) {
      return jsonError('The database is temporarily unavailable or took too long. Please try again.', 503, details);
    }
    if (/timeout exceeded when trying to connect|connection terminated|connection timeout/i.test(err?.message ?? '')) {
      return jsonError('The database connection timed out. Please try again.', 503, details);
    }

    const message = process.env.NODE_ENV === 'development' && err?.message ? err.message : 'Something went wrong.';
    return jsonError(message, 500, details);
  }
}

export function notifyId(): string {
  return `n_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
