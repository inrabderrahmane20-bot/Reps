import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { readDb, updateDb } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';
import { validateSponsored, campaignState, type CampaignState } from '@/lib/marketing-validation';
import { marketingError, requireAdminSession } from '@/lib/admin-api';
import type { SponsoredCampaign } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** One row of the admin campaigns table. */
export interface CampaignRow {
  /** A campaign lives on a provider profile — the provider id is its id. */
  id: string;
  providerId: string;
  providerName: string;
  providerTitle: string;
  category: string;
  avatar: string;
  campaign: SponsoredCampaign;
  state: CampaignState;
}

/** Provider summaries used by the "create campaign" dropdown. */
export interface CampaignProvider {
  id: string;
  name: string;
  title: string;
  category: string;
  avatar: string;
  hasCampaign: boolean;
}

/**
 * GET /api/admin/campaigns
 *
 * Returns every provider that has a sponsored campaign — including the ones
 * that are disabled, expired or scheduled for the future — plus the approved
 * providers that can still receive a campaign.
 */
export async function GET() {
  return withErrors(async () => {
    requireAdmin();
    const denied = requireAdminSession();
    if (denied) return denied;

    const db = readDb();
    const now = new Date();

    const campaigns: CampaignRow[] = [];
    const providers: CampaignProvider[] = [];

    for (const u of db.users) {
      if (!u.provider) continue;
      const isApproved = u.providerStatus === 'approved';
      const hasCampaign = !!u.provider.sponsored;
      if (isApproved) {
        providers.push({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`.trim(),
          title: u.provider.title,
          category: u.provider.category,
          avatar: u.avatar,
          hasCampaign,
        });
      }
      if (!hasCampaign) continue;
      campaigns.push({
        id: u.id,
        providerId: u.id,
        providerName: `${u.firstName} ${u.lastName}`.trim(),
        providerTitle: u.provider.title,
        category: u.provider.category,
        avatar: u.avatar,
        campaign: u.provider.sponsored as SponsoredCampaign,
        state: campaignState(u.provider.sponsored, now),
      });
    }

    campaigns.sort(
      (a, b) =>
        (b.campaign.priority ?? 0) - (a.campaign.priority ?? 0) ||
        a.providerName.localeCompare(b.providerName)
    );

    return NextResponse.json({ campaigns, providers });
  });
}

/**
 * POST /api/admin/campaigns
 *
 * Creates (or replaces) the sponsored campaign of one provider. The payload
 * is validated with exactly the same rules as the provider PATCH route.
 */
export async function POST(req: NextRequest) {
  return withErrors(async () => {
    requireAdmin();
    const denied = requireAdminSession();
    if (denied) return denied;

    const body = await req.json();
    const providerId = typeof body?.providerId === 'string' ? body.providerId.trim() : '';
    if (!providerId) return jsonError('Pick a provider for this campaign.', 400);

    const check = validateSponsored(body);
    if (!check.ok) return marketingError(check.issues);

    const campaign = check.value;

    const result = updateDb((db) => {
      const u = db.users.find((x) => x.id === providerId);
      if (!u || !u.provider) return null;
      u.provider.sponsored = campaign;
      return { ok: true, id: providerId, state: campaignState(campaign) };
    });

    if (!result) return jsonError('Provider not found.', 404);
    return NextResponse.json(result, { status: 201 });
  });
}
