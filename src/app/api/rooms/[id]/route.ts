import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { readDb } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';

// Presence is derived from whether a member has a live session — a real
// (if simple) signal, not a random placeholder.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    requireUser();
    const db = readDb();
    const room = db.rooms.find((r) => r.id === params.id);
    if (!room) return jsonError('Room not found.', 404);

    const now = Date.now();
    const activeUserIds = new Set(
      db.sessions.filter((s) => new Date(s.expiresAt).getTime() > now).map((s) => s.userId)
    );

    const contacts = room.memberIds.map((id) => {
      const u = db.users.find((x) => x.id === id);
      return {
        id,
        name: u ? `${u.firstName}` : 'Unknown',
        status: activeUserIds.has(id) ? 'online' : 'offline',
      };
    });

    return NextResponse.json({ room: { ...room, online: contacts.filter((c) => c.status === 'online').length }, contacts });
  });
}
