import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { updateDb } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    const me = requireUser();
    const result = updateDb((db) => {
      const n = db.notifications.find((x) => x.id === params.id && x.userId === me.id);
      if (!n) return null;
      n.read = true;
      return { ok: true };
    });
    if (!result) return jsonError('Not found.', 404);
    return NextResponse.json(result);
  });
}
