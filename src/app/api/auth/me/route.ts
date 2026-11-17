import { secureRoute } from '@/lib/security/route';
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { toPublicUser } from '@/lib/types';

async function handleGET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: toPublicUser(user, true) });
}

export const GET = secureRoute(handleGET);
