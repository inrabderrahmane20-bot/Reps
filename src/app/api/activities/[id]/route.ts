import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = readDb();
  const a = db.activities.find((x) => x.id === params.id);
  if (!a) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
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
