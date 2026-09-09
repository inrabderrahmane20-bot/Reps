import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { readDb, updateDb } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';
import { pushNotification } from '@/lib/notify';

// Steps 8-11: provider accepts/refuses, mission runs, client confirms completion.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    const me = requireUser();
    const { status } = await req.json();
    const allowed = ['accepted', 'refused', 'completed', 'cancelled'];
    if (!allowed.includes(status)) return jsonError('Invalid status.');

    const db = readDb();
    const request = db.serviceRequests.find((r) => r.id === params.id);
    if (!request) return jsonError('Request not found.', 404);

    const isProvider = request.providerId === me.id;
    const isClient = request.clientId === me.id;
    if (!isProvider && !isClient) return jsonError('Not allowed.', 403);
    if ((status === 'accepted' || status === 'refused') && !isProvider) return jsonError('Only the provider can do that.', 403);
    if (status === 'completed' && !isClient) return jsonError('Only the client can confirm completion.', 403);
    if (status === 'cancelled' && !isClient) return jsonError('Only the client can cancel.', 403);

    updateDb((d) => {
      const r = d.serviceRequests.find((x) => x.id === params.id)!;
      r.status = status;
      const notifyId = isProvider ? r.clientId : r.providerId;
      const label =
        status === 'accepted' ? 'accepted your service request' :
        status === 'refused' ? 'declined your service request' :
        status === 'completed' ? 'marked the mission as completed' : 'cancelled the request';
      pushNotification(d, notifyId, 'service_request', `Update: ${label}.`, '/profile');
    });

    return NextResponse.json({ ok: true });
  });
}
