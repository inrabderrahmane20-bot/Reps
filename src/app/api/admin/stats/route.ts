import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { readAdminStats } from '@/lib/db';
import { withErrors } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  return withErrors(async () => {
    await requireAdmin();
    return NextResponse.json(await readAdminStats());
  });
}
