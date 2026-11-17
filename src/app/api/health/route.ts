import { secureRoute } from '@/lib/security/route';
import { NextResponse } from 'next/server';
import { readCategoryState } from '@/lib/db';

export const dynamic = 'force-dynamic';
async function handleGET() {
  try {
    await readCategoryState();
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

export const GET = secureRoute(handleGET);
