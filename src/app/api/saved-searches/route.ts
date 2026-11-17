import { secureRoute } from '@/lib/security/route';
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { readDb, updateDb, newId } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function handleGET() {
  try {
    const user = await requireUser();
    const db = await readDb();
    const items = (db.savedSearches || []).filter((s: any) => s.userId === user.id);
    return NextResponse.json({ items });
  } catch (e: any) {
    if (e?.status === 401) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    return NextResponse.json({ error: 'error' }, { status: 500 });
  }
}

async function handlePOST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { query, filters } = body || {};
    if (!query) return NextResponse.json({ error: 'invalid' }, { status: 400 });
    const item = await updateDb((db) => {
      if (!db.savedSearches) db.savedSearches = [];
      const saved = {
        id: newId('ss'),
        userId: user.id,
        query,
        filters: filters || {},
        createdAt: new Date().toISOString(),
      };
      db.savedSearches.push(saved);
      return saved;
    });
    return NextResponse.json({ item });
  } catch (e: any) {
    if (e?.status === 401) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    return NextResponse.json({ error: 'error' }, { status: 500 });
  }
}

async function handleDELETE(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    await updateDb((db) => {
      if (!db.savedSearches) db.savedSearches = [];
      db.savedSearches = db.savedSearches.filter((s: any) => !(s.userId === user.id && s.id === id));
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.status === 401) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    return NextResponse.json({ error: 'error' }, { status: 500 });
  }
}

export const GET = secureRoute(handleGET);
export const POST = secureRoute(handlePOST);
export const DELETE = secureRoute(handleDELETE);
