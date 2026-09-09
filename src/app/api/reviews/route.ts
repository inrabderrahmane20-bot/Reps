import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { readDb, updateDb, newId } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';
import { pushNotification } from '@/lib/notify';

// Step 13: client leaves a review after a completed mission.
export async function POST(req: NextRequest) {
  return withErrors(async () => {
    const me = requireUser();
    const { requestId, rating, content } = await req.json();
    if (!requestId || !rating) return jsonError('A rating is required.');

    const db = readDb();
    const request = db.serviceRequests.find((r) => r.id === requestId);
    if (!request || request.clientId !== me.id) return jsonError('Request not found.', 404);
    if (request.status !== 'completed') return jsonError('You can only review a completed mission.');
    if (db.reviews.some((r) => r.requestId === requestId)) return jsonError('You already reviewed this mission.');

    const id = newId('rv');
    updateDb((d) => {
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
