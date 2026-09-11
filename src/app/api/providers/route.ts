import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { toPublicUser } from '@/lib/types';
import { classifyZone, haversineKm } from '@/lib/zones';

// Public marketplace listing: only approved providers are visible to clients.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const q = searchParams.get('q')?.toLowerCase();
  const availableNow = searchParams.get('availableNow') === 'true';
  const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
  const zone = searchParams.get('zone');
  const lat = searchParams.get('lat') ? Number(searchParams.get('lat')) : null;
  const lng = searchParams.get('lng') ? Number(searchParams.get('lng')) : null;

  const db = readDb();
  let providers = db.users.filter((u) => u.providerStatus === 'approved' && u.provider && u.status === 'active');

  if (category) providers = providers.filter((u) => u.provider!.category === category);
  if (availableNow) providers = providers.filter((u) => u.provider!.availability === 'available');
  if (verifiedOnly) providers = providers.filter((u) => u.providerStatus === 'approved');
  if (zone && zone !== 'all') {
    providers = providers.filter((u) => classifyZone(u.provider!.lat, u.provider!.lng, u.neighborhood) === zone);
  }
  if (q) {
    providers = providers.filter(
      (u) =>
        u.provider!.title.toLowerCase().includes(q) ||
        u.provider!.category.toLowerCase().includes(q) ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q)
    );
  }

  const result = providers.map((u) => {
    const reviews = db.reviews.filter((r) => r.providerId === u.id);
    const rating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
    const zoneId = classifyZone(u.provider!.lat, u.provider!.lng, u.neighborhood);
    const distanceKm = lat !== null && lng !== null ? haversineKm(lat, lng, u.provider!.lat, u.provider!.lng) : null;
    return { ...toPublicUser(u), zoneId, distanceKm, rating, reviewCount: reviews.length };
  });

  return NextResponse.json({ providers: result });
}
