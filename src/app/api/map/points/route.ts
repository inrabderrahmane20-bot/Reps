import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';

// Flagship interactive map data feed (SRS §18, §78): approved providers,
// open activities and communities with coordinates. Never exposes exact
// residential addresses of private users (SRS §55-56) — providers/activities
// use an approximate service-area point, not a home address.
export async function GET() {
  const db = readDb();

  const providers = db.users
    .filter((u) => u.providerStatus === 'approved' && u.provider)
    .map((u) => ({
      id: u.id,
      kind: 'provider' as const,
      name: `${u.firstName} ${u.lastName}`,
      category: u.provider!.category,
      availability: u.provider!.availability,
      lat: u.provider!.lat,
      lng: u.provider!.lng,
    }));

  const activities = db.activities
    .filter((a) => a.status === 'open' && a.visibility === 'public')
    .map((a) => ({
      id: a.id,
      kind: 'activity' as const,
      name: a.title,
      category: a.category,
      date: a.date,
      lat: a.lat,
      lng: a.lng,
    }));

  const communities = db.communities.map((c) => ({
    id: c.id,
    kind: 'community' as const,
    name: c.name,
    category: c.category,
    lat: c.lat,
    lng: c.lng,
  }));

  return NextResponse.json({ providers, activities, communities });
}
