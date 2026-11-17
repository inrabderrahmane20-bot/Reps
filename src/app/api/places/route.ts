import { secureRoute } from '@/lib/security/route';
import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function handleGET() {
  try {
    const db = await readDb();
    const places = (db.places || []).filter((p: any) => p.status !== 'inactive');
    return NextResponse.json({ places });
  } catch (e) {
    return NextResponse.json({ places: [] });
  }
}

export const GET = secureRoute(handleGET);
