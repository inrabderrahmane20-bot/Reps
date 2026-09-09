import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { readDb } from '@/lib/db';
import { withErrors } from '@/lib/api-helpers';
import { toPublicUser } from '@/lib/types';

export async function GET(req: NextRequest) {
  return withErrors(async () => {
    requireAdmin();
    const q = new URL(req.url).searchParams.get('q')?.toLowerCase();
    let list = readDb().users;
    if (q) list = list.filter((u) => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q));
    return NextResponse.json({ users: list.map((u) => ({ ...toPublicUser(u), email: u.email })) });
  });
}
