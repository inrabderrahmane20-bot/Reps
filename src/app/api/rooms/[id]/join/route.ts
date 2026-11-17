import { secureRoute } from '@/lib/security/route';
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { updateDb } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

async function handlePOST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  return withErrors(async () => {
    const me = await requireUser();
    const result = await updateDb((db) => {
      const room = db.rooms.find((r) => r.id === params.id);
      if (!room) return null;
      if (!room.memberIds.includes(me.id)) room.memberIds.push(me.id);
      return { online: room.memberIds.length };
    });
    if (!result) return jsonError('Room not found.', 404);
    return NextResponse.json(result);
  });
}

export const POST = secureRoute(handlePOST);
