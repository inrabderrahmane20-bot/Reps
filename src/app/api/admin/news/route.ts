import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { readDb, updateDb, newId } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';

export async function GET() {
  return withErrors(async () => {
    requireAdmin();
    return NextResponse.json({ news: readDb().news });
  });
}

export async function POST(req: NextRequest) {
  return withErrors(async () => {
    requireAdmin();
    const body = await req.json();
    const { title, category, city, neighborhood, summary, content, image, tags } = body ?? {};
    if (!title || !category || !summary) return jsonError('Title, category and summary are required.');
    const id = newId('n');
    updateDb((db) => {
      db.news.unshift({
        id,
        title,
        category,
        city: city || 'Marrakech',
        neighborhood: neighborhood || '',
        date: new Date().toISOString(),
        image: image || 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=800&auto=format&fit=crop',
        author: 'Medina Editorial Team',
        summary,
        content: Array.isArray(content) ? content : [content || summary],
        tags: Array.isArray(tags) ? tags : [],
        status: 'published',
      });
    });
    return NextResponse.json({ id }, { status: 201 });
  });
}
