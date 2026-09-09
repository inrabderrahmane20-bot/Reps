import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { updateDb } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';
import { pushNotification } from '@/lib/notify';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    const admin = requireAdmin();
    const { action } = await req.json();
    if (!['activate', 'suspend', 'ban'].includes(action)) return jsonError('Invalid action.');
    if (params.id === admin.id) return jsonError('You cannot moderate your own account.');

    const result = updateDb((db) => {
      const u = db.users.find((x) => x.id === params.id);
      if (!u) return null;
      u.status = action === 'activate' ? 'active' : action === 'suspend' ? 'suspended' : 'banned';
      if (u.status !== 'active') {
        db.sessions = db.sessions.filter((s) => s.userId !== u.id);
      }
      return { ok: true };
    });

    if (!result) return jsonError('User not found.', 404);
    return NextResponse.json(result);
  });
}
