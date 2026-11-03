import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { readDb, updateDb, newId } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';
import { pushNotification } from '@/lib/notify';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    const me = await requireUser();
    const db = await readDb();
    const convo = db.conversations.find((c) => c.id === params.id);
    if (!convo || !convo.participantIds.includes(me.id)) return jsonError('Conversation not found.', 404);

    await updateDb((d) => {
      d.messages
        .filter((m) => m.conversationId === params.id && m.senderId !== me.id && !m.readBy.includes(me.id))
        .forEach((m) => m.readBy.push(me.id));
    });

    const msgs = (await readDb()).messages.filter((m) => m.conversationId === params.id);
    return NextResponse.json({ messages: msgs, conversation: convo });
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    const me = await requireUser();
    const { content } = await req.json();
    if (!content || !content.trim()) return jsonError('Message cannot be empty.');

    const db = await readDb();
    const convo = db.conversations.find((c) => c.id === params.id);
    if (!convo || !convo.participantIds.includes(me.id)) return jsonError('Conversation not found.', 404);

    const id = newId('m');
    await updateDb((d) => {
      d.messages.push({ id, conversationId: params.id, senderId: me.id, content, createdAt: new Date().toISOString(), readBy: [me.id] });
      const otherId = convo.participantIds.find((p) => p !== me.id);
      if (otherId) pushNotification(d, otherId, 'message', `New message from ${me.firstName}.`, '/messages');
    });
    return NextResponse.json({ id }, { status: 201 });
  });
}
