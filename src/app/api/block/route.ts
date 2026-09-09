import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { updateDb } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';

// Toggle blocking another user (SRS §53).
export async function POST(req: Request) {
  return withErrors(async () => {
    const me = requireUser();
    const { userId } = await req.json();
    if (!userId) return jsonError('User is required.');
    const result = updateDb((db) => {
      const u = db.users.find((x) => x.id === me.id)!;
      const blocked = u.blockedUserIds.includes(userId);
      u.blockedUserIds = blocked ? u.blockedUserIds.filter((id) => id !== userId) : [...u.blockedUserIds, userId];
      return { blocked: !blocked };
    });
    return NextResponse.json(result);
  });
}
