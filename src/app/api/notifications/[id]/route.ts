import { secureRoute } from '@/lib/security/route';
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { updateDb } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

async function handlePATCH(_req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  return withErrors(async () => {
    const me = await requireUser();
    const result = await updateDb((db) => {
      const n = db.notifications.find((x) => x.id === params.id && x.userId === me.id);
      if (!n) return null;
      n.read = true;
      return { ok: true };
    });
    if (!result) return jsonError('Not found.', 404);
    return NextResponse.json(result);
  });
}

export const PATCH = secureRoute(handlePATCH);
