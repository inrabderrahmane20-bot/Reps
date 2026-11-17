import { secureRoute } from '@/lib/security/route';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { updateDb } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

async function handlePATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  return withErrors(async () => {
    await requireAdmin();
    const body = await req.json();
    const result = await updateDb((db) => {
      const a = db.activities.find((x) => x.id === params.id);
      if (!a) return null;
      Object.assign(a, body);
      if (body.lat != null) a.lat = Number(body.lat);
      if (body.lng != null) a.lng = Number(body.lng);
      if (body.max != null) a.max = Number(body.max);
      if (body.min != null) a.min = Number(body.min);
      return { ok: true };
    });
    if (!result) return jsonError('Activity not found.', 404);
    return NextResponse.json(result);
  });
}

async function handleDELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  return withErrors(async () => {
    await requireAdmin();
    await updateDb((db) => {
      db.activities = db.activities.filter((a) => a.id !== params.id);
    });
    return NextResponse.json({ ok: true });
  });
}
export const PATCH = secureRoute(handlePATCH);
export const DELETE = secureRoute(handleDELETE);
