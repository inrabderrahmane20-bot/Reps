import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { readDb, updateDb, newId } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';

function enrich(db: any, convo: any, meId: string) {
  const otherId = convo.participantIds.find((id: string) => id !== meId);
  const other = db.users.find((u: any) => u.id === otherId);
  const msgs = db.messages.filter((m: any) => m.conversationId === convo.id);
  const last = msgs[msgs.length - 1];
  const unread = msgs.filter((m: any) => m.senderId !== meId && !m.readBy.includes(meId)).length;
  return {
    id: convo.id,
    type: convo.type,
    otherUser: other ? { id: other.id, name: `${other.firstName} ${other.lastName}`, avatar: other.avatar } : null,
    lastMessage: last?.content ?? null,
    lastMessageAt: last?.createdAt ?? convo.createdAt,
    unread,
  };
}

// General messaging (SRS §42) — client<->provider, activity/community participants, etc.
// Meeting conversations (post-acceptance) also live here but are rendered with the
// retro MSN-style UI on the client.
export async function GET(req: NextRequest) {
  return withErrors(async () => {
    const me = requireUser();
    const typeFilter = new URL(req.url).searchParams.get('type');
    const db = readDb();
    let list = db.conversations.filter((c) => c.participantIds.includes(me.id));
    if (typeFilter) list = list.filter((c) => c.type === typeFilter);
    const result = list.map((c) => enrich(db, c, me.id)).sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1));
    return NextResponse.json({ conversations: result });
  });
}

export async function POST(req: NextRequest) {
  return withErrors(async () => {
    const me = requireUser();
    const { userId } = await req.json();
    if (!userId) return jsonError('Recipient is required.');
    const db = readDb();
    if (!db.users.some((u) => u.id === userId)) return jsonError('User not found.', 404);
    if (me.blockedUserIds?.includes(userId)) return jsonError('You have blocked this user.');
    const target = db.users.find((u) => u.id === userId)!;
    if (target.blockedUserIds?.includes(me.id)) return jsonError('You cannot message this user.');

    let convo = db.conversations.find(
      (c) => c.type === 'direct' && c.participantIds.includes(me.id) && c.participantIds.includes(userId)
    );
    if (!convo) {
      const id = newId('conv');
      updateDb((d) => {
        d.conversations.push({ id, type: 'direct', participantIds: [me.id, userId], relatedId: null, createdAt: new Date().toISOString() });
      });
      convo = { id, type: 'direct', participantIds: [me.id, userId], relatedId: null, createdAt: new Date().toISOString() };
    }
    return NextResponse.json({ id: convo.id }, { status: 201 });
  });
}
