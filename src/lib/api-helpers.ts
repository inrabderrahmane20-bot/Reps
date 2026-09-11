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
    const message = process.env.NODE_ENV === 'development' && err?.message ? err.message : 'Something went wrong.';
    return jsonError(message, 500);
  }
}

export function notifyId(): string {
  return `n_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
