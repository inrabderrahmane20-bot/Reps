import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { readDb, updateDb, newId } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    requireUser();
    const db = readDb();
    const msgs = db.roomMessages
      .filter((m) => m.roomId === params.id)
      .map((m) => {
        const sender = db.users.find((u) => u.id === m.senderId);
        return { ...m, senderName: sender ? `${sender.firstName}` : 'Unknown' };
      });
    return NextResponse.json({ messages: msgs });
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    const me = requireUser();
    const { content } = await req.json();
    if (!content || !content.trim()) return jsonError('Message cannot be empty.');
    const db = readDb();
    const room = db.rooms.find((r) => r.id === params.id);
    if (!room) return jsonError('Room not found.', 404);

    const id = newId('rm');
    updateDb((d) => {
      const rm = d.rooms.find((r) => r.id === params.id)!;
      if (!rm.memberIds.includes(me.id)) rm.memberIds.push(me.id);
      d.roomMessages.push({ id, roomId: params.id, senderId: me.id, content, createdAt: new Date().toISOString() });
    });
    return NextResponse.json({ id }, { status: 201 });
  });
}
