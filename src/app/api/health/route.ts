import { NextResponse } from 'next/server';
import { readCategoryState } from '@/lib/db';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    await readCategoryState();
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
