import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { updateDb } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    const me = requireUser();
    const result = updateDb((db) => {
      const room = db.rooms.find((r) => r.id === params.id);
      if (!room) return null;
      if (!room.memberIds.includes(me.id)) room.memberIds.push(me.id);
      return { online: room.memberIds.length };
    });
    if (!result) return jsonError('Room not found.', 404);
    return NextResponse.json(result);
  });
}
