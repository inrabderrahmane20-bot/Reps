import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { readDb, updateDb } from '@/lib/db';
import { withErrors } from '@/lib/api-helpers';

export async function GET() {
  return withErrors(async () => {
    const me = requireUser();
    const list = readDb().notifications.filter((n) => n.userId === me.id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return NextResponse.json({ notifications: list });
  });
}

// Mark all as read.
export async function PATCH() {
  return withErrors(async () => {
    const me = requireUser();
    updateDb((db) => {
      db.notifications.filter((n) => n.userId === me.id).forEach((n) => (n.read = true));
    });
    return NextResponse.json({ ok: true });
  });
}
