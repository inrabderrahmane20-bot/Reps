import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { readDb, updateDb } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';
import { toPublicUser } from '@/lib/types';
import { zoneFromNeighborhood } from '@/lib/zones';

export async function PATCH(req: NextRequest) {
  return withErrors(async () => {
    const me = requireUser();
    const body = await req.json();
    const allowed = ['firstName', 'lastName', 'city', 'neighborhood', 'bio', 'languages', 'interests', 'avatar', 'homeLat', 'homeLng', 'zoneId'] as const;

    updateDb((db) => {
      const u = db.users.find((x) => x.id === me.id)!;
      for (const key of allowed) {
        if (body[key] !== undefined) (u as any)[key] = body[key];
      }
      // If the user picked a neighborhood without an explicit zone, map it.
      if (body.neighborhood && body.zoneId === undefined) {
        const z = zoneFromNeighborhood(body.neighborhood);
        if (z) u.zoneId = z;
      }
    });

    const updated = readDb().users.find((u) => u.id === me.id)!;
    return NextResponse.json({ user: toPublicUser(updated) });
  });
}
