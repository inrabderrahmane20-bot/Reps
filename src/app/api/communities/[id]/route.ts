import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = readDb();
  const c = db.communities.find((x) => x.id === params.id);
  if (!c) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  const admins = db.users.filter((u) => c.adminIds.includes(u.id)).map((u) => `${u.firstName} ${u.lastName}`);
  return NextResponse.json({ community: { ...c, memberCount: c.memberIds.length, adminNames: admins } });
}
