import { secureRoute } from '@/lib/security/route';
import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function handleGET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const db = await readDb();
  const article = db.news.find((n) => n.id === params.id);
  if (!article) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  const related = db.news.filter((n) => n.id !== article.id && n.category === article.category).slice(0, 3);
  return NextResponse.json({ article, related });
}

export const GET = secureRoute(handleGET);
