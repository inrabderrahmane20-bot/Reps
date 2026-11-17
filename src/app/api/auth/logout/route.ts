import { secureRoute } from '@/lib/security/route';
import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

async function handlePOST() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}

export const POST = secureRoute(handlePOST);
