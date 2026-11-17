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
    const { status } = await req.json();
    if (!['under_review', 'resolved', 'rejected'].includes(status)) return jsonError('Invalid status.');
    const result = await updateDb((db) => {
      const r = db.reports.find((x) => x.id === params.id);
      if (!r) return null;
      r.status = status;
      return { ok: true };
    });
    if (!result) return jsonError('Report not found.', 404);
    return NextResponse.json(result);
  });
}

export const PATCH = secureRoute(handlePATCH);
