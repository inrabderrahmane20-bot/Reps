import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { updateDb } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';

// Toggles membership: join if not a member, leave if already a member.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    const me = requireUser();
    const result = updateDb((db) => {
      const c = db.communities.find((x) => x.id === params.id);
      if (!c) return null;
      const isMember = c.memberIds.includes(me.id);
      if (isMember) {
        c.memberIds = c.memberIds.filter((id) => id !== me.id);
      } else {
        c.memberIds.push(me.id);
      }
      return { joined: !isMember, memberCount: c.memberIds.length };
    });
    if (!result) return jsonError('Community not found.', 404);
    return NextResponse.json(result);
  });
}
