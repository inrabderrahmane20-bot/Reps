import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { classifyZone } from '@/lib/zones';

// Flagship interactive map data feed (SRS §18, §78): approved providers,
// open activities and communities with coordinates. Never exposes exact
// residential addresses of private users (SRS §55-56) — providers/activities
// use an approximate service-area point, not a home address. Accepts a
// `zone` query param to narrow points to one neighborhood zone.
export async function GET(req: NextRequest) {
  const zone = new URL(req.url).searchParams.get('zone');
  const forZone = (lat: number, lng: number, label?: string) =>
    !zone || zone === 'all' || classifyZone(lat, lng, label) === zone;

  const db = readDb();

  const providers = db.users
    .filter((u) => u.providerStatus === 'approved' && u.provider && forZone(u.provider.lat, u.provider.lng, u.neighborhood))
    .map((u) => ({
      id: u.id,
      kind: 'provider' as const,
      name: `${u.firstName} ${u.lastName}`,
      category: u.provider!.category,
      availability: u.provider!.availability,
      lat: u.provider!.lat,
      lng: u.provider!.lng,
      zoneId: classifyZone(u.provider!.lat, u.provider!.lng, u.neighborhood),
    }));

  const activities = db.activities
    .filter((a) => a.status === 'open' && a.visibility === 'public' && forZone(a.lat, a.lng, a.location))
    .map((a) => ({
      id: a.id,
      kind: 'activity' as const,
      name: a.title,
      category: a.category,
      date: a.date,
      lat: a.lat,
      lng: a.lng,
      zoneId: classifyZone(a.lat, a.lng, a.location),
    }));

  const communities = db.communities
    .filter((c) => forZone(c.lat, c.lng))
    .map((c) => ({
      id: c.id,
      kind: 'community' as const,
      name: c.name,
      category: c.category,
      lat: c.lat,
      lng: c.lng,
      zoneId: classifyZone(c.lat, c.lng),
    }));

  return NextResponse.json({ providers, activities, communities });
}
