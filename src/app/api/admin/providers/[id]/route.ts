import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { updateDb } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';
import { pushNotification } from '@/lib/notify';

// Admin approves/rejects a provider application (SRS §14). Only once approved
// does the provider become visible/searchable in the public marketplace.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    requireAdmin();
    const { action, rejectionReason } = await req.json();
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
  });
}
