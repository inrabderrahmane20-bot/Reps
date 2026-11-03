import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { readDb } from '@/lib/db';
import { withErrors } from '@/lib/api-helpers';
import { toPublicUser } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withErrors(async () => {
    await requireAdmin();
    const status = new URL(req.url).searchParams.get('status');
    const db = await readDb();
    let list = db.users.filter((u) => u.provider);
    if (status) list = list.filter((u) => u.providerStatus === status);
    return NextResponse.json({ providers: list.map(toPublicUser) });
  });
}
