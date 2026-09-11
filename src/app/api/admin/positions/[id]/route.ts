import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { updateDb } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';
import { classifyZone, getZone } from '@/lib/zones';

const IN_RANGE = { lat: (v: number) => Math.abs(v) <= 90, lng: (v: number) => Math.abs(v) <= 180 };

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    requireAdmin();
    const { lat, lng } = await req.json();
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (isNaN(latNum) || isNaN(lngNum) || !IN_RANGE.lat(latNum) || !IN_RANGE.lng(lngNum)) {
      return jsonError('Valid latitude (-90..90) and longitude (-180..180) are required.');
    }

    const result = updateDb((db) => {
      const u = db.users.find((x) => x.id === params.id);
      if (!u || !u.provider) return null;
      u.provider.lat = latNum;
      u.provider.lng = lngNum;
      u.neighborhood = getZone(classifyZone(latNum, lngNum, u.neighborhood))?.name ?? u.neighborhood;
      return { ok: true, zoneName: getZone(classifyZone(latNum, lngNum, u.neighborhood))?.name };
    });
    if (!result) return jsonError('Provider not found.', 404);
    return NextResponse.json(result);
  });
}