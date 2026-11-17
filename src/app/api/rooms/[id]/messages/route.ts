import { secureRoute } from '@/lib/security/route';
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { readDb, updateDb, newId } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

async function handleGET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  return withErrors(async () => {
    await requireUser();
    const db = await readDb();
    const msgs = db.roomMessages
      .filter((m) => m.roomId === params.id)
      .map((m) => {
        const sender = db.users.find((u) => u.id === m.senderId);
        return { ...m, senderName: sender ? `${sender.firstName}` : 'Unknown' };
      });
    return NextResponse.json({ messages: msgs });
  });
}

async function handlePOST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  return withErrors(async () => {
    const me = await requireUser();
    const { content } = await req.json();
    if (!content || !content.trim()) return jsonError('Message cannot be empty.');
    const db = await readDb();
    const room = db.rooms.find((r) => r.id === params.id);
    if (!room) return jsonError('Room not found.', 404);

    const id = newId('rm');
    await updateDb((d) => {
      const rm = d.rooms.find((r) => r.id === params.id)!;
      if (!rm.memberIds.includes(me.id)) rm.memberIds.push(me.id);
      d.roomMessages.push({ id, roomId: params.id, senderId: me.id, content, createdAt: new Date().toISOString() });
    });
    return NextResponse.json({ id }, { status: 201 });
  });
}

export const GET = secureRoute(handleGET);
export const POST = secureRoute(handlePOST);
