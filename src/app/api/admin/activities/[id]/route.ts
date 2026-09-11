import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { updateDb } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    requireAdmin();
    const body = await req.json();
    const result = updateDb((db) => {
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

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    requireAdmin();
    updateDb((db) => {
      db.activities = db.activities.filter((a) => a.id !== params.id);
    });
    return NextResponse.json({ ok: true });
  });
}