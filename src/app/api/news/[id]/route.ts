import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = readDb();
  const article = db.news.find((n) => n.id === params.id);
  if (!article) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  const related = db.news.filter((n) => n.id !== article.id && n.category === article.category).slice(0, 3);
  return NextResponse.json({ article, related });
}
