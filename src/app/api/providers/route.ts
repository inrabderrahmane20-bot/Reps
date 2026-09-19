import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { toPublicUser } from '@/lib/types';
import { classifyZone, haversineKm } from '@/lib/zones';
import { expandCategory } from '@/lib/service-categories';
import type { Availability } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Public marketplace listing: only approved providers are visible to clients.
//
// Supported query params:
//   q             — free-text against title, category or name
//   cat           — category filter; accepts a taxonomy top-level group,
//                   subcategory or single service and expands it to matching
//                   leaf categories server-side
//   availability  — comma-separated list of the provider states to include
//                   (available, later, offline); omit for all
//   minRating     — only providers with an average rating >= this value
//   zone          — restrict to a named zone
//   lat, lng      — used for distance display; not a filter
//   sort          — newest | rating | available | alpha
//   limit, offset — pagination; the response includes the filtered total
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.toLowerCase();
  const cat = searchParams.get('cat');
  const availabilityParam = searchParams.get('availability');
  const minRating = searchParams.get('minRating') ? Number(searchParams.get('minRating')) : null;
  const zone = searchParams.get('zone');
  const lat = searchParams.get('lat') ? Number(searchParams.get('lat')) : null;
  const lng = searchParams.get('lng') ? Number(searchParams.get('lng')) : null;
  const sort = searchParams.get('sort') ?? 'newest';
  const limit = searchParams.get('limit') ? Math.max(1, Number(searchParams.get('limit'))) : 24;
  const offset = searchParams.get('offset') ? Math.max(0, Number(searchParams.get('offset'))) : 0;

  // Accept both singular and plural param names for availability (comma-separated).
  const availability = (availabilityParam ?? searchParams.get('available') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean) as Availability[];

  const db = readDb();
  let providers = db.users.filter((u) => u.providerStatus === 'approved' && u.provider && u.status === 'active');

  if (cat) {
    const leaves = expandCategory(cat);
    if (leaves.length === 0) {
      return NextResponse.json({ providers: [], total: 0 });
    }
    const leafSet = new Set(leaves.map((l) => l.toLowerCase()));
    providers = providers.filter((u) => leafSet.has(u.provider!.category.toLowerCase()));
  }
  if (availability.length > 0) {
    const states = new Set(availability);
    providers = providers.filter((u) => states.has(u.provider!.availability));
  }
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

  let result = providers.map((u) => {
    const reviews = db.reviews.filter((r) => r.providerId === u.id);
    const rating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
    const zoneId = classifyZone(u.provider!.lat, u.provider!.lng, u.neighborhood);
    const distanceKm = lat !== null && lng !== null ? haversineKm(lat, lng, u.provider!.lat, u.provider!.lng) : null;
    return { ...toPublicUser(u), zoneId, distanceKm, rating, reviewCount: reviews.length };
  });

  if (minRating != null && !Number.isNaN(minRating)) {
    result = result.filter((p) => (p.rating ?? 0) >= minRating);
  }

  switch (sort) {
    case 'rating':
      result.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1) || b.reviewCount - a.reviewCount);
      break;
    case 'available': {
      const rank: Record<Availability, number> = { available: 0, later: 1, offline: 2 };
      result.sort(
        (a, b) => rank[a.provider!.availability] - rank[b.provider!.availability] || (b.rating ?? 0) - (a.rating ?? 0)
      );
      break;
    }
    case 'alpha':
      result.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
      break;
    case 'newest':
    default:
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
  }

  const total = result.length;
  const page = result.slice(offset, offset + limit);

  return NextResponse.json({ providers: page, total });
}