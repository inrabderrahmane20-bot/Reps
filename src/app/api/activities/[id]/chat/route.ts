import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { readDb, updateDb, newId } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';

// Lightweight group chat scoped to an activity (SRS §95). Uses the normal
// modern messaging UI — not the retro MSN style, which is reserved for Meetings.
function ensureConversation(db: any, activityId: string, activity: any) {
  let convo = db.conversations.find((c: any) => c.type === 'activity' && c.relatedId === activityId);
  if (!convo) {
    convo = { id: newId('conv'), type: 'activity', participantIds: [...activity.participantIds], relatedId: activityId, createdAt: new Date().toISOString() };
    db.conversations.push(convo);
  }
  return convo;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    const me = requireUser();
    const db = readDb();
    const activity = db.activities.find((a) => a.id === params.id);
    if (!activity) return jsonError('Activity not found.', 404);
    if (!activity.participantIds.includes(me.id)) return jsonError('Join the activity to see the chat.', 403);

    const convoId = updateDb((d) => {
      const a = d.activities.find((x) => x.id === params.id)!;
      const convo = ensureConversation(d, params.id, a);
      if (!convo.participantIds.includes(me.id)) convo.participantIds.push(me.id);
      return convo.id;
    });

    const msgs = readDb()
      .messages.filter((m) => m.conversationId === convoId)
      .map((m) => {
        const sender = db.users.find((u) => u.id === m.senderId);
        return { ...m, senderName: sender ? `${sender.firstName} ${sender.lastName}` : 'Unknown' };
      });
    return NextResponse.json({ messages: msgs, conversationId: convoId });
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    const me = requireUser();
    const { content } = await req.json();
    if (!content || !content.trim()) return jsonError('Message cannot be empty.');
    const db = readDb();
    const activity = db.activities.find((a) => a.id === params.id);
    if (!activity) return jsonError('Activity not found.', 404);
    if (!activity.participantIds.includes(me.id)) return jsonError('Join the activity to chat.', 403);

    updateDb((d) => {
      const a = d.activities.find((x) => x.id === params.id)!;
      const convo = ensureConversation(d, params.id, a);
      d.messages.push({ id: newId('m'), conversationId: convo.id, senderId: me.id, content, createdAt: new Date().toISOString(), readBy: [me.id] });
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  });
}
