import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { readDb } from '@/lib/db';
import { withErrors } from '@/lib/api-helpers';
import { nearestZoneId } from '@/lib/zones';

export async function GET() {
  return withErrors(async () => {
    requireAdmin();
    const db = readDb();
    const positions = db.users
      .filter((u) => u.provider)
      .map((u) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        category: u.provider!.category,
        providerStatus: u.providerStatus,
        availability: u.provider!.availability,
        lat: u.provider!.lat,
        lng: u.provider!.lng,
        zoneId: nearestZoneId(u.provider!.lat, u.provider!.lng),
      }));
    return NextResponse.json({ positions });
  });
}