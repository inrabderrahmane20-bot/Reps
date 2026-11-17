import { secureRoute } from '@/lib/security/route';
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { readDb, updateDb, newId } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function handleGET() {
  try {
    const user = await requireUser();
    const db = await readDb();
    const items = (db.favorites || []).filter((f: any) => f.userId === user.id);
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
    const { type, targetId, meta } = body || {};
    if (!type || !targetId) return NextResponse.json({ error: 'invalid' }, { status: 400 });
    const item = await updateDb((db) => {
      if (!db.favorites) db.favorites = [];
      // avoid duplicates
      const existing = db.favorites.find((f: any) => f.userId === user.id && f.type === type && f.targetId === targetId);
      if (existing) return existing;
      const fav = {
        id: newId('fav'),
        userId: user.id,
        type,
        targetId,
        meta: meta || {},
        createdAt: new Date().toISOString(),
      };
      db.favorites.push(fav);
      return fav;
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
    const type = searchParams.get('type');
    const targetId = searchParams.get('targetId');
    await updateDb((db) => {
      if (!db.favorites) db.favorites = [];
      db.favorites = db.favorites.filter((f: any) => !(f.userId === user.id && f.type === type && f.targetId === targetId));
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
