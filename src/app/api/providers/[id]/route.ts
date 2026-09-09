import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { toPublicUser } from '@/lib/types';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = readDb();
  const u = db.users.find((x) => x.id === params.id);
  if (!u || !u.provider || u.providerStatus !== 'approved') {
    return NextResponse.json({ error: 'Provider not found.' }, { status: 404 });
  }
  const reviews = db.reviews
    .filter((r) => r.providerId === u.id)
    .map((r) => {
      const author = db.users.find((a) => a.id === r.authorId);
      return { ...r, authorName: author ? `${author.firstName} ${author.lastName[0]}.` : 'Anonymous' };
    });
  const rating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

  return NextResponse.json({ provider: { ...toPublicUser(u), rating, reviews } });
}
