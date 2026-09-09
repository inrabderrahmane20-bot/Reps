import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const category = new URL(req.url).searchParams.get('category');
  const db = readDb();
  let list = db.news.filter((n) => n.status === 'published');
  if (category) list = list.filter((n) => n.category === category);
  list = list.sort((a, b) => (a.date < b.date ? 1 : -1));
  return NextResponse.json({ news: list });
}
