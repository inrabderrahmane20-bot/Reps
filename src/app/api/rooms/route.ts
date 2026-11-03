import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = await readDb();
  const rooms = db.rooms.map((r) => ({ ...r, online: r.memberIds.length }));
  return NextResponse.json({ rooms });
}
