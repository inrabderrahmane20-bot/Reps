import { secureRoute } from '@/lib/security/route';
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { readDb, updateDb, newId } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';
import { pushNotification } from '@/lib/notify';

// Step 13: client leaves a review after a completed mission.
export const dynamic = 'force-dynamic';

async function handlePOST(req: NextRequest) {
  return withErrors(async () => {
    const me = await requireUser();
    const { requestId, rating, content } = await req.json();
    if (!requestId || !Number.isInteger(rating) || rating < 1 || rating > 5) return jsonError('A rating from 1 to 5 is required.');
    if (typeof content !== 'string' || content.length > 5000) return jsonError('Invalid review content.');

    const db = await readDb();
    const request = db.serviceRequests.find((r) => r.id === requestId);
    if (!request || request.clientId !== me.id) return jsonError('Request not found.', 404);
    if (request.status !== 'completed') return jsonError('You can only review a completed mission.');
    if (db.reviews.some((r) => r.requestId === requestId)) return jsonError('You already reviewed this mission.');

    const id = newId('rv');
    await updateDb((d) => {
      if (d.reviews.some((r) => r.requestId === requestId)) throw Object.assign(new Error('Duplicate review.'), { status: 409 });
      d.reviews.push({
        id,
        providerId: request.providerId,
        authorId: me.id,
        requestId,
        rating: Math.max(1, Math.min(5, Number(rating))),
        content: content || '',
        createdAt: new Date().toISOString(),
      });
      pushNotification(d, request.providerId, 'review', `${me.firstName} left you a ${rating}★ review.`, `/services/${request.providerId}`);
    });

    return NextResponse.json({ id }, { status: 201 });
  });
}

export const POST = secureRoute(handlePOST);
