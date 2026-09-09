import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { updateDb } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    requireAdmin();
    const body = await req.json();
    const result = updateDb((db) => {
      const n = db.news.find((x) => x.id === params.id);
      if (!n) return null;
      Object.assign(n, body);
      return { ok: true };
    });
    if (!result) return jsonError('Article not found.', 404);
    return NextResponse.json(result);
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    requireAdmin();
    updateDb((db) => {
      db.news = db.news.filter((n) => n.id !== params.id);
    });
    return NextResponse.json({ ok: true });
  });
}
