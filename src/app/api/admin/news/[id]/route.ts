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
      const n = db.news.find((x) => x.id === params.id);
      if (!n) return null;
      Object.assign(n, body);
      return { ok: true };
    });
    if (!result) return jsonError('Article not found.', 404);
    return NextResponse.json(result);
  });
}

async function handleDELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  return withErrors(async () => {
    await requireAdmin();
    await updateDb((db) => {
      db.news = db.news.filter((n) => n.id !== params.id);
    });
    return NextResponse.json({ ok: true });
  });
}

export const PATCH = secureRoute(handlePATCH);
export const DELETE = secureRoute(handleDELETE);
