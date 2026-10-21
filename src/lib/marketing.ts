// Marketing helpers for sponsored placements and promotions.
//
// Pure TS (no Node APIs) so it is safe to import from both server routes and
// client components. All date windows are ISO strings and are treated as
// inclusive on both ends.
//
// Two distinct concepts (they combine freely):
//   Sponsored — the provider paid for visibility (placement order).
//   Promotion — the provider is offering a discount (badges, deals page).
//
// This module is the SINGLE source of truth for promotion eligibility. The
// homepage, the /promotions page, the /search API and the admin preview all
// call `activePromotion()`, so a future / expired / disabled / invalid offer
// can never leak into one surface and not another.

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
  if (start > end) return false;
  const t = now.getTime();
  return t >= start && t <= end;
}

/** Is the promotion window currently active (dates only)? */
export function isPromotionActive(
  promo: PromotionInfo | null | undefined,
  now: Date = new Date()
): boolean {
  if (!promo) return false;
  const start = Date.parse(promo.startDate);
  const end = Date.parse(promo.endDate);
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  if (start > end) return false;
  const t = now.getTime();
  return t >= start && t <= end;
}

/* -------------------------------------------------------------------------- */
/* Prices                                                                      */
/* -------------------------------------------------------------------------- */

export interface PromotionPrices {
  /** Original price in MAD, when it can be read without guessing. */
  original: number | null;
  /** Promotional price in MAD, when it can be read without guessing. */
  current: number | null;
  /** Discount in percent (0–100), derived from validated prices. */
  discountPercent: number | null;
  /** Discount in MAD, derived from validated prices. */
  discountAmount: number | null;
}

/**
 * Reads a price out of a display string such as "249 DH".
 *
 * Returns `null` for anything ambiguous (ranges like "100-200 DH", free text,
 * empty values) so that no discount is ever derived from a guess.
 */
export function parsePriceAmount(value?: string | null): number | null {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d+(?:[.,]\d{1,2})?)\s*(?:dh|mad)?$/i);
  if (!match) return null;
  const n = Number(match[1].replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * The validated numeric view of a promotion.
 *
 * Explicit numeric fields win; otherwise the display string is parsed. When
 * both prices are known the discount is *derived* from them rather than
 * trusted from the stored type/value pair.
 */
export function promotionPrices(promo: PromotionInfo | null | undefined): PromotionPrices {
  const empty: PromotionPrices = {
    original: null,
    current: null,
    discountPercent: null,
    discountAmount: null,
  };
  if (!promo) return empty;

  const original =
    typeof promo.originalPriceValue === 'number' && promo.originalPriceValue > 0
      ? promo.originalPriceValue
      : parsePriceAmount(promo.originalPrice);
  const current =
    typeof promo.promotionalPriceValue === 'number' && promo.promotionalPriceValue > 0
      ? promo.promotionalPriceValue
      : parsePriceAmount(promo.promotionalPrice);

  if (original !== null && current !== null && original > current) {
    const amount = original - current;
    return {
      original,
      current,
      discountAmount: amount,
      discountPercent: Math.round((amount / original) * 100),
    };
  }

  // No usable price pair: fall back to the declared type/value, but only when
  // that declaration is itself meaningful.
  if (promo.type === 'percent' && promo.value > 0 && promo.value <= 100) {
    return { ...empty, original, current, discountPercent: Math.round(promo.value) };
  }
  if (promo.type === 'fixed' && promo.value > 0) {
    return { ...empty, original, current, discountAmount: Math.round(promo.value) };
  }
  if (promo.type === 'price' && current !== null) {
    return { ...empty, original, current };
  }
  return { ...empty, original, current };
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Is this promotion coherent enough to be shown as a real offer?
 *
 * Rejects: broken dates, an inverted date window, a non-positive discount,
 * a percentage above 100, a promotional price that is not lower than the
 * original one, and a declared discount that disagrees with the prices.
 */
export function isPromotionValid(
  promo: PromotionInfo | null | undefined,
  now: Date = new Date()
): boolean {
  if (!promo) return false;

  const start = Date.parse(promo.startDate);
  const end = Date.parse(promo.endDate);
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  if (start > end) return false;

  if (promo.type === 'percent') {
    if (!(promo.value > 0) || promo.value > 100) return false;
  } else if (promo.type === 'fixed') {
    if (!(promo.value > 0)) return false;
  } else if (promo.type !== 'price') {
    return false;
  }

  const prices = promotionPrices(promo);
  // Both prices known → the original must genuinely be higher.
  if (prices.original !== null && prices.current !== null && prices.original <= prices.current) {
    return false;
  }
  // Both prices known AND a declared discount → they must agree.
  if (prices.original !== null && prices.current !== null) {
    if (promo.type === 'percent' && prices.discountPercent !== null) {
      if (Math.abs(prices.discountPercent - promo.value) > 1) return false;
    }
    if (promo.type === 'fixed' && prices.discountAmount !== null) {
      if (Math.abs(prices.discountAmount - promo.value) > 1) return false;
    }
  }
  // A "price" offer without a promotional price has nothing to show.
  if (promo.type === 'price' && prices.current === null) return false;

  void now;
  return true;
}

/**
 * The promotion when it is currently active AND coherent, otherwise null.
 * This is the only function the UI should use to decide "is this on offer?".
 */
export function activePromotion(
  promo?: PromotionInfo | null,
  now: Date = new Date()
): PromotionInfo | null {
  if (!promo) return null;
  if (!isPromotionActive(promo, now)) return null;
  if (!isPromotionValid(promo, now)) return null;
  return promo;
}

/**
 * Compact badge text for an active promotion, e.g. "-20%" or "-50 DH".
 * Derived from the validated prices when they are known so the badge can
 * never contradict the price pair shown next to it.
 */
export function promotionBadge(promo: PromotionInfo): string {
  const prices = promotionPrices(promo);
  if (prices.discountPercent !== null && prices.discountPercent > 0) {
    return `-${prices.discountPercent}%`;
  }
  if (prices.discountAmount !== null && prices.discountAmount > 0) {
    return `-${Math.round(prices.discountAmount)} MAD`;
  }
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

/** Days left before the offer ends (null when unknown or already over). */
export function promotionDaysLeft(promo: PromotionInfo, now: Date = new Date()): number | null {
  const end = Date.parse(promo.endDate);
  if (Number.isNaN(end)) return null;
  const diff = end - now.getTime();
  if (diff < 0) return null;
  return Math.floor(diff / 86_400_000);
}
