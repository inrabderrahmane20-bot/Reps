import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { updateDb, newId } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = requireUser();
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope') || 'all';
    const db = (await import('@/lib/db')).readDb();
    let items: any[] = db.invitations || [];
    if (scope === 'received') items = items.filter((i: any) => i.receiverId === user.id);
    else if (scope === 'sent') items = items.filter((i: any) => i.senderId === user.id);
    else items = items.filter((i: any) => i.senderId === user.id || i.receiverId === user.id);
    return NextResponse.json({ items });
  } catch (e: any) {
    if (e?.status === 401) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    return NextResponse.json({ error: 'error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireUser();
    const body = await req.json();
    const { receiverId, type = 'general', relatedId = null, message = '' } = body || {};
    if (!receiverId) return NextResponse.json({ error: 'invalid' }, { status: 400 });
    const item = updateDb((db) => {
      if (!db.invitations) db.invitations = [];
      const inv: any = {
        id: newId('inv'),
        senderId: user.id,
        receiverId,
        type,
        relatedId,
        message,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.invitations.push(inv);
      return inv;
    });
    return NextResponse.json({ item });
  } catch (e: any) {
    if (e?.status === 401) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    return NextResponse.json({ error: 'error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = requireUser();
    const body = await req.json();
    const { id, status } = body || {};
    if (!id || !status) return NextResponse.json({ error: 'invalid' }, { status: 400 });
    const item = updateDb((db) => {
      if (!db.invitations) db.invitations = [];
      const inv = db.invitations.find((i: any) => i.id === id);
      if (!inv) throw new Error('not found');
      if (inv.receiverId !== user.id && inv.senderId !== user.id) throw new Error('forbidden');
      inv.status = status;
      inv.updatedAt = new Date().toISOString();
      return inv;
    });
    return NextResponse.json({ item });
  } catch (e: any) {
    if (e?.status === 401) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    if (e?.message === 'forbidden') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    if (e?.message === 'not found') return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ error: 'error' }, { status: 500 });
  }
}
