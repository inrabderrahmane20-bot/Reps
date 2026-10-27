import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = readDb();
    const places = (db.places || []).filter((p: any) => p.status !== 'inactive');
    return NextResponse.json({ places });
  } catch (e) {
    return NextResponse.json({ places: [] });
  }
}
