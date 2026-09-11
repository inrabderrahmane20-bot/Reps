import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { readDb } from '@/lib/db';
import { withErrors } from '@/lib/api-helpers';
import { classifyZone, getZone } from '@/lib/zones';

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
        zoneId: classifyZone(u.provider!.lat, u.provider!.lng, u.neighborhood),
        zoneName: getZone(classifyZone(u.provider!.lat, u.provider!.lng, u.neighborhood))?.name,
      }));
    return NextResponse.json({ positions });
  });
}