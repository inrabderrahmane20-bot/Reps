import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { updateDb, newId } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';

// Universal report button (SRS §52).
export async function POST(req: NextRequest) {
  return withErrors(async () => {
    const me = requireUser();
    const { targetType, targetId, reason, details } = await req.json();
    if (!targetType || !targetId || !reason) return jsonError('Target and reason are required.');
    const id = newId('rp');
    updateDb((db) => {
      db.reports.push({
        id,
        reporterId: me.id,
        targetType,
        targetId,
        reason,
        details: details || '',
        status: 'new',
        createdAt: new Date().toISOString(),
      });
    });
    return NextResponse.json({ id }, { status: 201 });
  });
}
