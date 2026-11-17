import { secureRoute } from '@/lib/security/route';
import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function handleGET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const db = await readDb();
  const c = db.communities.find((x) => x.id === params.id);
  if (!c) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  const admins = db.users.filter((u) => c.adminIds.includes(u.id)).map((u) => `${u.firstName} ${u.lastName}`);
  return NextResponse.json({ community: { ...c, memberCount: c.memberIds.length, adminNames: admins } });
}

export const GET = secureRoute(handleGET);
