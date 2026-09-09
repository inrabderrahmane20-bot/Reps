import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { readDb, updateDb, newId } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';
import { pushNotification } from '@/lib/notify';

// Accept/decline (SRS §31). On accept, opens the retro Meetings conversation.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    const me = requireUser();
    const { status } = await req.json();
    if (!['accepted', 'declined'].includes(status)) return jsonError('Invalid status.');

    const db = readDb();
    const request = db.meetingRequests.find((r) => r.id === params.id);
    if (!request || request.receiverId !== me.id) return jsonError('Request not found.', 404);

    let conversationId: string | null = null;
    updateDb((d) => {
      const r = d.meetingRequests.find((x) => x.id === params.id)!;
      r.status = status;
      pushNotification(
        d,
        r.senderId,
        'meeting_request',
        status === 'accepted' ? `${me.firstName} accepted your meeting request!` : `${me.firstName} declined your meeting request.`,
        '/meetings'
      );
      if (status === 'accepted') {
        let convo = d.conversations.find(
          (c) => c.type === 'meeting' && c.participantIds.includes(r.senderId) && c.participantIds.includes(r.receiverId)
        );
        if (!convo) {
          convo = { id: newId('conv'), type: 'meeting', participantIds: [r.senderId, r.receiverId], relatedId: r.id, createdAt: new Date().toISOString() };
          d.conversations.push(convo);
        }
        conversationId = convo.id;
      }
    });

    return NextResponse.json({ ok: true, conversationId });
  });
}
