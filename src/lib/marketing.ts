// Marketing helpers for sponsored placements and promotions.
//
// Pure TS (no Node APIs) so it is safe to import from both server routes and
// client components. All date windows are ISO strings and are treated as
// inclusive on both ends.
//
// Two distinct concepts (they combine freely):
//   Sponsored — the provider paid for visibility (placement order).
//   Promotion — the provider is offering a discount (badges, deals page).

import type { PromotionInfo, SponsoredCampaign } from './types';

/** Is the sponsorship window currently active for the given campaign? */
export function isSponsorshipActive(
  campaign: SponsoredCampaign | null | undefined,
  now: Date = new Date()
): boolean {
  if (!campaign || !campaign.active) return false;
  const start = Date.parse(campaign.startDate);
  const end = Date.parse(campaign.endDate);
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  const t = now.getTime();
  return t >= start && t <= end;
}

/** Is the promotion window currently active? */
export function isPromotionActive(
  promo: PromotionInfo | null | undefined,
  now: Date = new Date()
): boolean {
  if (!promo) return false;
  const start = Date.parse(promo.startDate);
  const end = Date.parse(promo.endDate);
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  const t = now.getTime();
  return t >= start && t <= end;
}

/** The promotion when it is currently active, otherwise null. */
export function activePromotion(promo?: PromotionInfo | null): PromotionInfo | null {
  return promo && isPromotionActive(promo) ? promo : null;
}

/** Compact badge text for an active promotion, e.g. "-20%". */
export function promotionBadge(promo: PromotionInfo): string {
  if (promo.label) return promo.label;
  switch (promo.type) {
    case 'percent':
      return `-${Math.round(promo.value)}%`;
    case 'fixed':
      return `-${Math.round(promo.value)} MAD`;
    default:
      return 'Promo';
  }
}