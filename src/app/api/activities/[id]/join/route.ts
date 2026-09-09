import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { updateDb } from '@/lib/db';
import { pushNotification } from '@/lib/notify';
import { withErrors, jsonError } from '@/lib/api-helpers';

// Toggle join/leave. Public activities: join instantly if there's room.
// Private activities: adds to a pending list the creator must approve (SRS §25).
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    const me = requireUser();
    const result = updateDb((db) => {
      const a = db.activities.find((x) => x.id === params.id);
      if (!a) return null;

      if (a.participantIds.includes(me.id)) {
        a.participantIds = a.participantIds.filter((id) => id !== me.id);
        return { status: 'left', participants: a.participantIds.length };
      }
      if (a.pendingParticipantIds.includes(me.id)) {
        a.pendingParticipantIds = a.pendingParticipantIds.filter((id) => id !== me.id);
        return { status: 'request_cancelled', participants: a.participantIds.length };
      }
      if (a.participantIds.length >= a.max) {
        return { error: 'This activity is full.' };
      }
      if (a.visibility === 'private') {
        a.pendingParticipantIds.push(me.id);
        pushNotification(db, a.creatorId, 'activity', `${me.firstName} ${me.lastName} asked to join "${a.title}".`, `/activities/${a.id}`);
        return { status: 'pending_approval', participants: a.participantIds.length };
      }
      a.participantIds.push(me.id);
      pushNotification(db, a.creatorId, 'activity', `${me.firstName} ${me.lastName} joined "${a.title}".`, `/activities/${a.id}`);
      return { status: 'joined', participants: a.participantIds.length };
    });

    if (!result) return jsonError('Activity not found.', 404);
    if ('error' in result) return jsonError(result.error);
    return NextResponse.json(result);
  });
}
