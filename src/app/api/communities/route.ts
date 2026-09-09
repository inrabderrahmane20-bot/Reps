import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { readDb, updateDb, newId } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';

function enrich(c: any) {
  return { ...c, memberCount: c.memberIds.length };
}

export async function GET(req: NextRequest) {
  const category = new URL(req.url).searchParams.get('category');
  const db = readDb();
  let list = db.communities;
  if (category) list = list.filter((c) => c.category === category);
  return NextResponse.json({ communities: list.map(enrich) });
}

export async function POST(req: NextRequest) {
  return withErrors(async () => {
    const me = requireUser();
    const { name, description, city, category, cover, rules } = await req.json();
    if (!name || !description || !category) return jsonError('Name, description and category are required.');
    const id = newId('c');
    updateDb((db) => {
      db.communities.push({
        id,
        name,
        description,
        city: city || 'Marrakech',
        category,
        cover: cover || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1200&auto=format&fit=crop',
        rules: Array.isArray(rules) ? rules : [],
        creatorId: me.id,
        adminIds: [me.id],
        memberIds: [me.id],
        lat: 31.6295 + (Math.random() - 0.5) * 0.05,
        lng: -8.0089 + (Math.random() - 0.5) * 0.05,
        createdAt: new Date().toISOString(),
      });
    });
    return NextResponse.json({ id }, { status: 201 });
  });
}
