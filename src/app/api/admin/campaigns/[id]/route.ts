import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { readDb, updateDb } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';
import { validateSponsored, campaignState } from '@/lib/marketing-validation';
import { marketingError, requireAdminSession } from '@/lib/admin-api';
import type { SponsoredCampaign } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** The campaign of one provider — the provider id is the campaign id. */
function findCampaign(id: string) {
  const db = readDb();
  const u = db.users.find((x) => x.id === id);
  if (!u || !u.provider || !u.provider.sponsored) return null;
  return {
    id: u.id,
    providerId: u.id,
    providerName: `${u.firstName} ${u.lastName}`.trim(),
    providerTitle: u.provider.title,
    category: u.provider.category,
    avatar: u.avatar,
    campaign: u.provider.sponsored as SponsoredCampaign,
    state: campaignState(u.provider.sponsored),
  };
}

/** GET /api/admin/campaigns/:id — a single campaign. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    requireAdmin();
    const denied = requireAdminSession();
    if (denied) return denied;

    const row = findCampaign(params.id);
    if (!row) return jsonError('Campaign not found.', 404);
    return NextResponse.json({ campaign: row });
  });
}

/**
 * PATCH /api/admin/campaigns/:id
 *
 * Updates the campaign of a provider. The body is merged into the stored
 * campaign (so `{"active": false}` alone is enough to pause a placement) and
 * the result is validated before it is written.
 *
 * `{"action": "enable" | "disable"}` is a shortcut for the switch.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    requireAdmin();
    const denied = requireAdminSession();
    if (denied) return denied;

    const body = await req.json();
    const existing = findCampaign(params.id);
    if (!existing) return jsonError('Campaign not found.', 404);

    if (body?.action === 'enable' || body?.action === 'disable') {
      const check = validateSponsored({ ...existing.campaign, active: body.action === 'enable' });
      if (!check.ok) return marketingError(check.issues);
      const saved = updateDb((db) => {
        const u = db.users.find((x) => x.id === params.id);
        if (!u || !u.provider) return null;
        u.provider.sponsored = check.value;
        return { ok: true, id: params.id, state: campaignState(check.value) };
      });
      if (!saved) return jsonError('Provider not found.', 404);
      return NextResponse.json(saved);
    }

    // Merge the patch over the stored campaign, ignoring explicit undefined.
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body ?? {})) {
      if (value !== undefined) patch[key] = value;
    }

    const check = validateSponsored({ ...existing.campaign, ...patch });
    if (!check.ok) return marketingError(check.issues);

    const saved = updateDb((db) => {
      const u = db.users.find((x) => x.id === params.id);
      if (!u || !u.provider) return null;
      u.provider.sponsored = check.value;
      return { ok: true, id: params.id, state: campaignState(check.value) };
    });

    if (!saved) return jsonError('Provider not found.', 404);
    return NextResponse.json(saved);
  });
}

/** DELETE /api/admin/campaigns/:id — removes the campaign object entirely. */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    requireAdmin();
    const denied = requireAdminSession();
    if (denied) return denied;

    const removed = updateDb((db) => {
      const u = db.users.find((x) => x.id === params.id);
      if (!u || !u.provider || !u.provider.sponsored) return null;
      u.provider.sponsored = null;
      return { ok: true, id: params.id };
    });

    if (!removed) return jsonError('Campaign not found.', 404);
    return NextResponse.json(removed);
  });
}
