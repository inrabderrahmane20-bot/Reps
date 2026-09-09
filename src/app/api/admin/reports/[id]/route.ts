import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { updateDb } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    requireAdmin();
    const { status } = await req.json();
    if (!['under_review', 'resolved', 'rejected'].includes(status)) return jsonError('Invalid status.');
    const result = updateDb((db) => {
      const r = db.reports.find((x) => x.id === params.id);
      if (!r) return null;
      r.status = status;
      return { ok: true };
    });
    if (!result) return jsonError('Report not found.', 404);
    return NextResponse.json(result);
  });
}
