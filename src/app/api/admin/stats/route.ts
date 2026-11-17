import { secureRoute } from '@/lib/security/route';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { readAdminStats } from '@/lib/db';
import { withErrors } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

async function handleGET() {
  return withErrors(async () => {
    await requireAdmin();
    return NextResponse.json(await readAdminStats());
  });
}

export const GET = secureRoute(handleGET);
