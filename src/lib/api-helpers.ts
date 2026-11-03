import { NextResponse } from 'next/server';

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Wrap a route handler body; converts thrown auth errors (with .status) into JSON error responses. */
export async function withErrors(fn: () => Promise<Response> | Response): Promise<Response> {
  try {
    return await fn();
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') return jsonError('You must be signed in.', 401);
    if (err?.message === 'FORBIDDEN') return jsonError('Not allowed.', 403);
    console.error(err);
    if (err?.message === 'Supabase tables are not initialized. Run "npm run db:migrate" before deploying.') {
      return jsonError(err.message, 503);
    }
    if (err?.message === 'Configure POSTGRES_PRISMA_URL in Vercel before using the application database.') {
      return jsonError(err.message, 503);
    }
    if (
      ['SELF_SIGNED_CERT_IN_CHAIN', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'CERT_HAS_EXPIRED']
        .includes(err?.code)
    ) {
      return jsonError(
        'The database TLS certificate could not be verified. Set POSTGRES_CA_CERT in Vercel using the CA certificate from Supabase Database Settings.',
        503
      );
    }
    if (err?.code === '28P01') {
      return jsonError('The database rejected its credentials. Check that the rotated POSTGRES_PRISMA_URL in Vercel matches Supabase.', 503);
    }
    const message = process.env.NODE_ENV === 'development' && err?.message ? err.message : 'Something went wrong.';
    return jsonError(message, 500);
  }
}

export function notifyId(): string {
  return `n_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
