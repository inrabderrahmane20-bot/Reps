import { secureRoute } from '@/lib/security/route';
import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function handleGET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const db = await readDb();
  const a = db.activities.find((x) => x.id === params.id);
  if (!a) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  const user = await getSessionUser();
  if (a.status === 'cancelled' || (a.visibility === 'private' && user?.role !== 'admin' && user?.id !== a.creatorId && !a.participantIds.includes(user?.id ?? ''))) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  const creator = db.users.find((u) => u.id === a.creatorId);
  const participants = db.users
    .filter((u) => a.participantIds.includes(u.id))
    .map((u) => ({ id: u.id, name: `${u.firstName} ${u.lastName}`, avatar: u.avatar }));
  return NextResponse.json({
    activity: {
      ...a,
      participants: a.participantIds.length,
      participantList: participants,
      creatorName: creator ? `${creator.firstName} ${creator.lastName}` : 'Unknown',
    },
  });
}

export const GET = secureRoute(handleGET);
