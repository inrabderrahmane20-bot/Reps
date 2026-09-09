import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { readDb } from '@/lib/db';
import { withErrors } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  return withErrors(async () => {
    requireAdmin();
    const status = new URL(req.url).searchParams.get('status');
    const db = readDb();
    let list = db.reports;
    if (status) list = list.filter((r) => r.status === status);
    const enriched = list
      .map((r) => ({ ...r, reporterName: nameOf(db, r.reporterId) }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return NextResponse.json({ reports: enriched });
  });
}
function nameOf(db: any, id: string) {
  const u = db.users.find((x: any) => x.id === id);
  return u ? `${u.firstName} ${u.lastName}` : 'Unknown';
}
