import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { toPublicUser } from '@/lib/types';

export async function GET() {
  const user = getSessionUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: toPublicUser(user) });
}
