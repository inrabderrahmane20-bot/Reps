import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { updateDb } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';
import { pushNotification } from '@/lib/notify';

const PROVIDER_FIELDS = ['category', 'title', 'description', 'specialties', 'serviceArea', 'priceRange', 'availability', 'documents', 'portfolio'] as const;
const AVAILABILITY = ['available', 'later', 'offline'];

// Admin approves/rejects a provider application (SRS §14) OR edits the
// provider account (profile + position). Only once approved does the provider
// become visible/searchable in the public marketplace.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    requireAdmin();
    const body = await req.json();

    if (body.action) {
      const { action, rejectionReason } = body;
      if (!['approve', 'reject', 'suspend'].includes(action)) return jsonError('Invalid action.');

      const result = updateDb((db) => {
        const u = db.users.find((x) => x.id === params.id);
        if (!u || !u.provider) return null;
        if (action === 'approve') {
          u.providerStatus = 'approved';
          u.provider.availability = 'available';
          delete u.provider.rejectionReason;
          pushNotification(db, u.id, 'provider_status', 'Congratulations — your provider application was approved! You are now visible in the marketplace.', '/provider/dashboard');
        } else if (action === 'reject') {
          u.providerStatus = 'rejected';
          u.provider.rejectionReason = rejectionReason || 'Application did not meet verification requirements.';
          pushNotification(db, u.id, 'provider_status', 'Your provider application was rejected. Check your provider dashboard for details.', '/provider/dashboard');
        } else if (action === 'suspend') {
          u.providerStatus = 'rejected';
          u.provider.rejectionReason = rejectionReason || 'Provider verification was suspended by an administrator.';
          pushNotification(db, u.id, 'provider_status', 'Your provider verification has been suspended.', '/provider/dashboard');
        }
        return { ok: true };
      });

      if (!result) return jsonError('Provider not found.', 404);
      return NextResponse.json(result);
    }

    // Profile / position edit (no action key).
    if (
      body.availability != null &&
      !AVAILABILITY.includes(body.availability)
    ) {
      return jsonError('Availability must be one of: available, later, offline.');
    }
    const latNum = body.lat != null ? Number(body.lat) : null;
    const lngNum = body.lng != null ? Number(body.lng) : null;
    if (latNum != null && (isNaN(latNum) || Math.abs(latNum) > 90)) return jsonError('Invalid latitude.');
    if (lngNum != null && (isNaN(lngNum) || Math.abs(lngNum) > 180)) return jsonError('Invalid longitude.');

    const result = updateDb((db) => {
      const u = db.users.find((x) => x.id === params.id);
      if (!u || !u.provider) return null;
      for (const key of PROVIDER_FIELDS) {
        if (body[key] !== undefined) (u.provider as any)[key] = body[key];
      }
      if (latNum != null) u.provider.lat = latNum;
      if (lngNum != null) u.provider.lng = lngNum;
      // Editing a rejected/suspended application resets it to pending review.
      if (u.providerStatus === 'rejected') {
        u.providerStatus = 'pending';
        delete u.provider.rejectionReason;
      }
      return { ok: true };
    });

    if (!result) return jsonError('Provider not found.', 404);
    return NextResponse.json(result);
  });
}