import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { toPublicUser } from '@/lib/types';
import { classifyZone } from '@/lib/zones';
import { expandCategory, findParentTop, normalizeCategory } from '@/lib/service-categories';
import { activePromotion, promotionPrices } from '@/lib/marketing';
import type { PromotionInfo } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Public listing of the ACTIVE promotions only.
//
// This endpoint never invents an offer: a provider is included only when
// `activePromotion()` (src/lib/marketing.ts — the single source of truth used
// by the homepage, this page and the search API) returns a coherent, in-window
// promotion. Expired, scheduled, disabled and incoherent offers are excluded.
//
// Supported query params:
//   locale        — used to localise the category labels in the facets
//   q             — free text against title, category, provider name, promo text
//   cat           — category filter (top-level group, subcategory or leaf)
//   minDiscount   — minimum discount in percent (offers without a known
//                   discount percentage are excluded)
//   maxDiscount   — maximum discount in percent
//   minPrice      — minimum promotional price in MAD
//   maxPrice      — maximum promotional price in MAD
//   sort          — discount | price-asc | price-desc | ending | newest | relevance
//   limit, offset — pagination; the response includes the filtered total
//
// Response:
//   { providers, total, categories: [{ name, count }], priceRange: { min, max } }

function num(value: string | null): number | null {
  if (value === null || value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Strip accents and lowercase — used for the free-text match only. */
function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

type Scored = {
  row: ReturnType<typeof toPublicUser> & {
    zoneId: string;
    rating: number | null;
    reviewCount: number;
    promotion: PromotionInfo;
    prices: ReturnType<typeof promotionPrices>;
    family: string;
    relevance: number;
  };
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const cat = searchParams.get('cat');
  const minDiscount = num(searchParams.get('minDiscount'));
  const maxDiscount = num(searchParams.get('maxDiscount'));
  const minPrice = num(searchParams.get('minPrice'));
  const maxPrice = num(searchParams.get('maxPrice'));
  const sort = searchParams.get('sort') ?? (q ? 'relevance' : 'discount');
  const limit = Math.min(60, Math.max(1, num(searchParams.get('limit')) ?? 24));
  const offset = Math.max(0, num(searchParams.get('offset')) ?? 0);

  const db = readDb();
  const now = new Date();

  // 1. Keep only providers with a currently active, coherent promotion.
  const promoted = db.users
    .filter((u) => u.providerStatus === 'approved' && u.provider && u.status === 'active')
    .map((u) => {
      const promo = activePromotion(u.provider!.promotion, now);
      if (!promo) return null;
      const reviews = db.reviews.filter((r) => r.providerId === u.id);
      const rating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
      return {
        user: u,
        promo,
        prices: promotionPrices(promo),
        family: findParentTop(u.provider!.category) ?? u.provider!.category,
        rating,
        reviewCount: reviews.length,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // 2. Text search (accent-insensitive).
  const needle = fold(q);
  let rows: Scored[] = [];
  for (const { user, promo, prices, family, rating, reviewCount } of promoted) {
    const title = user.provider!.title;
    const name = `${user.firstName} ${user.lastName}`;
    let relevance = 0;
    if (needle) {
      const hay = `${title} ${user.provider!.category} ${name} ${promo.description ?? ''} ${promo.label ?? ''}`;
      if (!fold(hay).includes(needle)) continue;
      relevance = 1;
      if (fold(title).startsWith(needle)) relevance = 3;
      else if (fold(title).includes(needle)) relevance = 2;
      else if (fold(name).includes(needle)) relevance = 2;
      else if (fold(user.provider!.category).includes(needle)) relevance = 1;
    }
    rows.push({
      row: {
        ...toPublicUser(user),
        zoneId: classifyZone(user.provider!.lat, user.provider!.lng, user.neighborhood),
        rating,
        reviewCount,
        promotion: promo,
        prices,
        family,
        relevance,
      },
    });
  }

  // 3. Category filter (expands a family / subcategory to its leaf services).
  if (cat && cat !== 'all') {
    const leaves = new Set(expandCategory(cat).map((l) => normalizeCategory(l)));
    if (leaves.size === 0) {
      return NextResponse.json({ providers: [], total: 0, categories: [], priceRange: { min: null, max: null } });
    }
    rows = rows.filter((r) => leaves.has(normalizeCategory(r.row.provider!.category)));
  }

  // 4. Discount size + price range (only offers whose numbers are known).
  if (minDiscount !== null) {
    rows = rows.filter((r) => r.row.prices.discountPercent !== null && r.row.prices.discountPercent >= minDiscount);
  }
  if (maxDiscount !== null) {
    rows = rows.filter((r) => r.row.prices.discountPercent !== null && r.row.prices.discountPercent <= maxDiscount);
  }
  if (minPrice !== null) {
    rows = rows.filter((r) => r.row.prices.current !== null && r.row.prices.current >= minPrice);
  }
  if (maxPrice !== null) {
    rows = rows.filter((r) => r.row.prices.current !== null && r.row.prices.current <= maxPrice);
  }

  // 5. Facets: which categories actually carry an offer, and the price bounds.
  const categoryCounts = new Map<string, number>();
  for (const r of rows) {
    const key = r.row.family;
    categoryCounts.set(key, (categoryCounts.get(key) ?? 0) + 1);
  }
  const categories = [...categoryCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const priced = rows.map((r) => r.row.prices.current).filter((v): v is number => v !== null);
  const priceRange = {
    min: priced.length ? Math.min(...priced) : null,
    max: priced.length ? Math.max(...priced) : null,
  };

  // 6. Sorting.
  const byDiscount = (a: Scored, b: Scored) =>
    (b.row.prices.discountPercent ?? -1) - (a.row.prices.discountPercent ?? -1);
  switch (sort) {
    case 'price-asc':
      rows.sort((a, b) => {
        const pa = a.row.prices.current;
        const pb = b.row.prices.current;
        if (pa === null && pb === null) return byDiscount(a, b);
        if (pa === null) return 1;
        if (pb === null) return -1;
        return pa - pb || byDiscount(a, b);
      });
      break;
    case 'price-desc':
      rows.sort((a, b) => {
        const pa = a.row.prices.current;
        const pb = b.row.prices.current;
        if (pa === null && pb === null) return byDiscount(a, b);
        if (pa === null) return 1;
        if (pb === null) return -1;
        return pb - pa || byDiscount(a, b);
      });
      break;
    case 'ending':
      // Soonest deadline first.
      rows.sort((a, b) => Date.parse(a.row.promotion.endDate) - Date.parse(b.row.promotion.endDate));
      break;
    case 'newest':
      rows.sort((a, b) => Date.parse(b.row.createdAt) - Date.parse(a.row.createdAt));
      break;
    case 'relevance':
      rows.sort(
        (a, b) =>
          b.row.relevance - a.row.relevance ||
          byDiscount(a, b) ||
          (b.row.rating ?? -1) - (a.row.rating ?? -1)
      );
      break;
    case 'discount':
    default:
      rows.sort((a, b) => byDiscount(a, b) || (b.row.rating ?? -1) - (a.row.rating ?? -1));
      break;
  }

  const total = rows.length;
  const page = rows.slice(offset, offset + limit).map((r) => r.row);

  return NextResponse.json({ providers: page, total, categories, priceRange });
}
