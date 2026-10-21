// Validation helpers for the marketing records edited from the admin panel:
// promotions (discounts) and sponsored campaigns (paid placements).
//
// `lib/marketing` owns *eligibility* ("is this campaign running right now?").
// This module owns *validity* ("is this record coherent enough to be stored?").
//
// It is pure TypeScript — no Node APIs, no React — so the exact same rules run
// in the admin UI (live feedback before saving) and in the route handlers
// (the only place that decides what reaches the database). A broken record
// must never be persisted: an incoherent price pair would produce a public
// "discount" that is not a discount.

import { isPromotionValid, parsePriceAmount } from './marketing';
import type { PromotionInfo, PromotionType, SponsoredCampaign, SponsoredPlacement } from './types';

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

/** A single validation problem, tied to the form field that caused it. */
export interface MarketingIssue {
  /** Dotted path of the offending field, e.g. `promotion.promotionalPrice`. */
  field: string;
  /** Human readable (English — the admin area is English-only) explanation. */
  message: string;
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; issues: MarketingIssue[] };

/** Lifecycle of a sponsored campaign, as shown in the admin table. */
export type CampaignState = 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'DISABLED';

export const PLACEMENTS: SponsoredPlacement[] = ['home', 'services', 'both'];
export const PROMOTION_TYPES: PromotionType[] = ['percent', 'fixed', 'price'];

export function failure<T = never>(field: string, message: string): ValidationResult<T> {
  return { ok: false, issues: [{ field, message }] };
}

/* -------------------------------------------------------------------------- */
/* Primitives                                                                  */
/* -------------------------------------------------------------------------- */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Strict ISO date reader. Accepts `YYYY-MM-DD` and full ISO timestamps
 * (`YYYY-MM-DDTHH:mm[:ss[.SSS]][Z|±HH:mm]`) — nothing else, so a locale
 * string such as "31/12/2026" or a free-text value is rejected.
 */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

export function parseIsoDate(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!ISO_DATE.test(trimmed)) return null;
  const t = Date.parse(trimmed);
  return Number.isNaN(t) ? null : t;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** http(s) URL check — used for campaign/promotion images. */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Internal destination check. A campaign link must stay inside the site:
 * a relative path starting with `/`. Protocol-relative (`//evil.com`),
 * scheme-prefixed (`https://evil.com`, `javascript:…`) and backslash tricks
 * are all rejected.
 */
export function isInternalPath(value: string): boolean {
  const v = value.trim();
  if (!v.startsWith('/')) return false;
  if (/^[/\\]{2}/.test(v)) return false; // protocol-relative / "\evil.com"
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return false; // absolute scheme
  for (let i = 0; i < v.length; i += 1) {
    const code = v.charCodeAt(i);
    if (code < 32 || code === 127) return false; // control characters
  }
  return true;
}

/* -------------------------------------------------------------------------- */
/* Sponsored campaigns                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Validates a sponsored campaign payload.
 *
 * Rules:
 *  - `active` must be a boolean.
 *  - `image` must be empty or a valid http(s) URL.
 *  - `priority` must be a finite number.
 *  - `startDate`/`endDate` must be parseable ISO dates with start <= end.
 *  - `placement` must be one of home | services | both.
 *  - `href` must be an internal relative path (never an external URL).
 *  - `title`/`notes` are optional free text.
 */
export function validateSponsored(input: unknown): ValidationResult<SponsoredCampaign> {
  if (!isPlainObject(input)) return failure('sponsored', 'The sponsored campaign must be an object.');

  const issues: MarketingIssue[] = [];

  const active = input.active;
  if (active !== undefined && typeof active !== 'boolean') {
    issues.push({ field: 'sponsored.active', message: 'The campaign switch must be true or false.' });
  }

  const rawImage = input.image ?? '';
  let image = '';
  if (typeof rawImage !== 'string') {
    issues.push({ field: 'sponsored.image', message: 'The campaign image must be a URL string.' });
  } else {
    image = rawImage.trim();
    if (image && !isHttpUrl(image)) {
      issues.push({ field: 'sponsored.image', message: 'The campaign image must be a valid http(s) URL (or left empty).' });
    }
  }

  const priority = input.priority === undefined || input.priority === null ? 0 : toFiniteNumber(input.priority);
  if (priority === null) {
    issues.push({ field: 'sponsored.priority', message: 'The priority must be a number.' });
  }

  const start = parseIsoDate(input.startDate);
  const end = parseIsoDate(input.endDate);
  if (start === null) {
    issues.push({ field: 'sponsored.startDate', message: 'The campaign start date must be a valid ISO date (YYYY-MM-DD).' });
  }
  if (end === null) {
    issues.push({ field: 'sponsored.endDate', message: 'The campaign end date must be a valid ISO date (YYYY-MM-DD).' });
  }
  if (start !== null && end !== null && start > end) {
    issues.push({ field: 'sponsored.endDate', message: 'The campaign end date must be on or after the start date.' });
  }

  let placement: SponsoredPlacement = 'both';
  const rawPlacement = input.placement;
  if (rawPlacement !== undefined && rawPlacement !== null && rawPlacement !== '') {
    if (!PLACEMENTS.includes(rawPlacement as SponsoredPlacement)) {
      issues.push({ field: 'sponsored.placement', message: 'The placement must be one of: home, services, both.' });
    } else {
      placement = rawPlacement as SponsoredPlacement;
    }
  }

  let href: string | undefined;
  const rawHref = input.href;
  if (rawHref !== undefined && rawHref !== null && String(rawHref).trim() !== '') {
    const candidate = String(rawHref).trim();
    if (!isInternalPath(candidate)) {
      issues.push({
        field: 'sponsored.href',
        message: 'The campaign link must be an internal path starting with "/" — external URLs are not allowed.',
      });
    } else {
      href = candidate;
    }
  }

  const title = readOptionalText(input.title, 'sponsored.title', issues);
  const notes = readOptionalText(input.notes, 'sponsored.notes', issues);

  if (issues.length) return { ok: false, issues };

  return {
    ok: true,
    value: {
      active: active === undefined ? false : (active as boolean),
      image,
      priority: priority as number,
      startDate: (input.startDate as string).trim(),
      endDate: (input.endDate as string).trim(),
      placement,
      ...(title ? { title } : {}),
      ...(href ? { href } : {}),
      ...(notes ? { notes } : {}),
    },
  };
}

/** ACTIVE / SCHEDULED / EXPIRED / DISABLED for a stored campaign. */
export function campaignState(campaign: SponsoredCampaign | null | undefined, now: Date = new Date()): CampaignState {
  if (!campaign || !campaign.active) return 'DISABLED';
  const start = Date.parse(campaign.startDate);
  const end = Date.parse(campaign.endDate);
  if (Number.isNaN(start) || Number.isNaN(end) || start > end) return 'EXPIRED';
  const t = now.getTime();
  if (t < start) return 'SCHEDULED';
  if (t > end) return 'EXPIRED';
  return 'ACTIVE';
}

/* -------------------------------------------------------------------------- */
/* Promotions                                                                  */
/* -------------------------------------------------------------------------- */

function readOptionalText(raw: unknown, field: string, issues: MarketingIssue[]): string | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== 'string') {
    issues.push({ field, message: 'This field must be text.' });
    return undefined;
  }
  const text = raw.trim();
  return text ? text : undefined;
}

interface DisplayPrice {
  text?: string;
  amount: number | null;
}

/**
 * Reads a display price such as "250 DH" or "250". Anything ambiguous — a
 * range ("100-200 DH"), free text, a zero amount — is rejected instead of
 * being guessed at.
 */
function readDisplayPrice(raw: unknown, field: string, issues: MarketingIssue[]): DisplayPrice {
  if (raw === undefined || raw === null) return { amount: null };
  if (typeof raw !== 'string') {
    issues.push({ field, message: 'The price must be a text value such as "250 DH".' });
    return { amount: null };
  }
  const text = raw.trim();
  if (!text) return { amount: null };
  const amount = parsePriceAmount(text);
  if (amount === null) {
    issues.push({
      field,
      message: `"${text}" is not a simple amount. Use a price such as "250 DH" or "250" (no range, no extra text).`,
    });
    return { amount: null };
  }
  return { text, amount };
}

function readPositiveNumber(raw: unknown, field: string, issues: MarketingIssue[]): number | null {
  if (raw === undefined || raw === null) return null;
  const n = toFiniteNumber(raw);
  if (n === null) {
    issues.push({ field, message: 'This price must be a number.' });
    return null;
  }
  if (!(n > 0)) {
    issues.push({ field, message: 'This price must be greater than 0 MAD.' });
    return null;
  }
  return n;
}

/**
 * Validates a promotion payload.
 *
 * Rules:
 *  - `type` must be percent | fixed | price.
 *  - `value` must be > 0 and <= 100 for percent, > 0 for fixed, ignored for price.
 *  - `startDate`/`endDate` must be parseable ISO dates with start <= end.
 *  - `originalPrice`/`promotionalPrice` must be simple amounts ("250 DH").
 *  - When both prices are known the promotional price must be strictly lower.
 *  - When both prices are known, percent must agree within 1 point and fixed
 *    within 1 MAD with the derived discount.
 *  - A "price" offer needs a promotional price.
 */
export function validatePromotion(input: unknown): ValidationResult<PromotionInfo> {
  if (!isPlainObject(input)) return failure('promotion', 'The promotion must be an object.');

  const issues: MarketingIssue[] = [];

  const type = input.type;
  const typeOk = type === 'percent' || type === 'fixed' || type === 'price';
  if (!typeOk) {
    issues.push({ field: 'promotion.type', message: 'The promotion type must be one of: percent, fixed, price.' });
  }

  let value = 0;
  if (input.value === undefined || input.value === null) {
    value = 0; // "price" offers ignore the value; percent/fixed require it below.
  } else {
    const parsed = toFiniteNumber(input.value);
    if (parsed === null) {
      issues.push({ field: 'promotion.value', message: 'The discount value must be a number.' });
    } else {
      value = parsed;
      if (type === 'percent') {
        if (!(value > 0)) {
          issues.push({ field: 'promotion.value', message: 'A percentage discount must be greater than 0%.' });
        } else if (value > 100) {
          issues.push({ field: 'promotion.value', message: 'A percentage discount cannot exceed 100%.' });
        }
      } else if (type === 'fixed' && !(value > 0)) {
        issues.push({ field: 'promotion.value', message: 'A fixed discount must be greater than 0 MAD.' });
      }
    }
  }

  const start = parseIsoDate(input.startDate);
  const end = parseIsoDate(input.endDate);
  if (start === null) {
    issues.push({ field: 'promotion.startDate', message: 'The promotion start date must be a valid ISO date (YYYY-MM-DD).' });
  }
  if (end === null) {
    issues.push({ field: 'promotion.endDate', message: 'The promotion end date must be a valid ISO date (YYYY-MM-DD).' });
  }
  if (start !== null && end !== null && start > end) {
    issues.push({ field: 'promotion.endDate', message: 'The promotion end date must be on or after the start date.' });
  }

  const originalDisplay = readDisplayPrice(input.originalPrice, 'promotion.originalPrice', issues);
  const promoDisplay = readDisplayPrice(input.promotionalPrice, 'promotion.promotionalPrice', issues);
  const originalNumeric = readPositiveNumber(input.originalPriceValue, 'promotion.originalPriceValue', issues);
  const promoNumeric = readPositiveNumber(input.promotionalPriceValue, 'promotion.promotionalPriceValue', issues);

  if (originalDisplay.amount !== null && originalNumeric !== null && Math.abs(originalDisplay.amount - originalNumeric) > 0.01) {
    issues.push({
      field: 'promotion.originalPriceValue',
      message: 'The numeric original price does not match the displayed original price.',
    });
  }
  if (promoDisplay.amount !== null && promoNumeric !== null && Math.abs(promoDisplay.amount - promoNumeric) > 0.01) {
    issues.push({
      field: 'promotion.promotionalPriceValue',
      message: 'The numeric promotional price does not match the displayed promotional price.',
    });
  }

  const original = originalNumeric ?? originalDisplay.amount;
  const current = promoNumeric ?? promoDisplay.amount;

  if (original !== null && current !== null) {
    if (current >= original) {
      issues.push({
        field: 'promotion.promotionalPrice',
        message: 'The promotional price must be strictly lower than the original price.',
      });
    } else {
      const derivedPercent = Math.round(((original - current) / original) * 100);
      const derivedAmount = original - current;
      if (type === 'percent' && Math.abs(derivedPercent - value) > 1) {
        issues.push({
          field: 'promotion.value',
          message: `The prices describe a ${derivedPercent}% discount, not ${value}% (the difference must be 1 point or less).`,
        });
      }
      if (type === 'fixed' && Math.abs(derivedAmount - value) > 1) {
        issues.push({
          field: 'promotion.value',
          message: `The prices describe a ${Math.round(derivedAmount)} MAD discount, not ${value} MAD (the difference must be 1 MAD or less).`,
        });
      }
    }
  }

  if (type === 'price' && current === null) {
    issues.push({
      field: 'promotion.promotionalPrice',
      message: 'A fixed-price offer needs a promotional price (for example "199 DH").',
    });
  }

  const description = readOptionalText(input.description, 'promotion.description', issues);
  const label = readOptionalText(input.label, 'promotion.label', issues);
  let image: string | undefined;
  const rawImage = input.image;
  if (rawImage !== undefined && rawImage !== null && String(rawImage).trim() !== '') {
    const candidate = String(rawImage).trim();
    if (!isHttpUrl(candidate) && !isInternalPath(candidate)) {
      issues.push({ field: 'promotion.image', message: 'The promotion image must be an http(s) URL or an internal path.' });
    } else {
      image = candidate;
    }
  }

  if (issues.length) return { ok: false, issues };

  const normalized: PromotionInfo = {
    type: type as PromotionType,
    value,
    startDate: (input.startDate as string).trim(),
    endDate: (input.endDate as string).trim(),
    ...(originalDisplay.text ? { originalPrice: originalDisplay.text } : {}),
    ...(promoDisplay.text ? { promotionalPrice: promoDisplay.text } : {}),
    ...(original !== null ? { originalPriceValue: original } : {}),
    ...(current !== null ? { promotionalPriceValue: current } : {}),
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
    ...(label ? { label } : {}),
  };

  // Last word: the shared rule set from lib/marketing must agree too.
  if (!isPromotionValid(normalized)) {
    return failure('promotion', 'This promotion is not consistent — check the dates, the discount and the prices.');
  }

  return { ok: true, value: normalized };
}
