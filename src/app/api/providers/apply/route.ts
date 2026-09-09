import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { readDb, updateDb } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';
import { pushNotification } from '@/lib/notify';
import { toPublicUser } from '@/lib/types';

// A regular user submits (or edits/resubmits) a provider application.
// It goes to providerStatus "pending" and only becomes visible in the
// marketplace once an admin approves it (see /api/admin/providers/[id]).
export async function POST(req: NextRequest) {
  return withErrors(async () => {
    const me = requireUser();
    const body = await req.json();
    const { category, title, description, specialties, serviceArea, priceRange, documents } = body ?? {};

    if (!category || !title || !description) {
      return jsonError('Category, title and description are required.');
    }

    updateDb((db) => {
      const u = db.users.find((x) => x.id === me.id)!;
      u.providerStatus = 'pending';
      u.provider = {
        category,
        title,
        description,
        specialties: Array.isArray(specialties) ? specialties : [],
        serviceArea: serviceArea || '',
        priceRange: priceRange || '',
        availability: 'later',
        lat: 31.6295 + (Math.random() - 0.5) * 0.04,
        lng: -8.0089 + (Math.random() - 0.5) * 0.04,
        portfolio: [],
        documents: Array.isArray(documents) ? documents : [],
      };
      // Notify admins
      db.users.filter((a) => a.role === 'admin').forEach((admin) => {
        pushNotification(
          db,
          admin.id,
          'provider_application',
          `${u.firstName} ${u.lastName} applied to become a provider (${category}).`,
          '/admin/providers'
        );
      });
    });

    const updated = readDb().users.find((u) => u.id === me.id)!;
    return NextResponse.json({ user: toPublicUser(updated) });
  });
}
