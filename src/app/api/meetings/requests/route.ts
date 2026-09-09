import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { readDb, updateDb, newId } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';
import { pushNotification } from '@/lib/notify';

export async function GET() {
  return withErrors(async () => {
    const me = requireUser();
    const db = readDb();
    const incoming = db.meetingRequests
      .filter((r) => r.receiverId === me.id)
      .map((r) => ({ ...r, otherUser: publicName(db, r.senderId) }));
    const outgoing = db.meetingRequests
      .filter((r) => r.senderId === me.id)
      .map((r) => ({ ...r, otherUser: publicName(db, r.receiverId) }));
    return NextResponse.json({ incoming, outgoing });
  });
}

function publicName(db: any, id: string) {
  const u = db.users.find((x: any) => x.id === id);
  return u ? { id: u.id, name: `${u.firstName} ${u.lastName}`, avatar: u.avatar } : null;
}

export async function POST(req: NextRequest) {
  return withErrors(async () => {
    const me = requireUser();
    const { receiverId } = await req.json();
    if (!receiverId) return jsonError('Recipient is required.');
    if (receiverId === me.id) return jsonError('You cannot send a request to yourself.');

    const db = readDb();
    if (db.meetingRequests.some((r) => r.senderId === me.id && r.receiverId === receiverId && r.status === 'pending')) {
      return jsonError('You already sent a request to this person.');
    }

    const id = newId('mr');
    updateDb((d) => {
      d.meetingRequests.push({ id, senderId: me.id, receiverId, status: 'pending', createdAt: new Date().toISOString() });
      pushNotification(d, receiverId, 'meeting_request', `${me.firstName} sent you a meeting request.`, '/meetings');
    });
    return NextResponse.json({ id }, { status: 201 });
  });
}
