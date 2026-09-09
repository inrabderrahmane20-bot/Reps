import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';

export async function GET() {
  const db = readDb();
  const rooms = db.rooms.map((r) => ({ ...r, online: r.memberIds.length }));
  return NextResponse.json({ rooms });
}
