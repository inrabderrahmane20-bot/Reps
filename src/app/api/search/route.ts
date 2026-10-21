import { NextRequest, NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { readDb } from '@/lib/db';
import type { Db } from '@/lib/types';
import { TAXONOMY, collectLeaves } from '@/lib/service-categories';
import { activePromotion, promotionBadge } from '@/lib/marketing';
import { matchScore } from '@/lib/search';
import { categoryMessageKey } from '@/lib/category-labels';
import { locales, type Locale } from '@/i18n/config';
import type { SearchGroup, SearchItem } from '@/lib/search-types';

export const dynamic = 'force-dynamic';

/**
 * Global search endpoint — powers the floating search pill and the /search
 * page.
 *
 * Design notes
 *   • Server side on purpose: the marketplace holds ~1.5k providers, so the
 *     catalogue is never shipped to the browser. Only approved + active
 *     providers, published news, public activities and public communities are
 *     ever returned.
 *   • `q` empty  → returns suggestions (top categories + live promotions).
 *   • `q` filled → returns grouped hits, ranked with the shared fuzzy scorer.
 */

export type SearchKind = 'service' | 'promotion' | 'category' | 'news' | 'community' | 'activity';

/** Short-lived snapshot — the JSON store is parsed on every read otherwise. */
let snapshot: { db: Db; at: number } | null = null;
const SNAPSHOT_TTL = 8000;

function dbSnapshot(): Db {
  const now = Date.now();
  if (snapshot && now - snapshot.at < SNAPSHOT_TTL) return snapshot.db;
  snapshot = { db: readDb(), at: now };
  return snapshot.db;
}

const SERVICE_LIMIT = 6;
const PROMO_LIMIT = 4;
const CATEGORY_LIMIT = 5;
const SECONDARY_LIMIT = 3;

/** Localised labels for a top-level family, with the raw name as fallback. */
function localizeCategory(
  name: string,
  tCategories: (key: string) => string
): string {
  const key = categoryMessageKey(name);
  if (!key) return name;
  try {
    return tCategories(key) || name;
  } catch {
    return name;
  }
}

function buildCategoryItems(
  query: string,
  tCategories: (key: string) => string,
  countLabel: (count: number) => string
): SearchItem[] {
  const items: Array<{ item: SearchItem; score: number }> = [];

  for (const node of TAXONOMY) {
    const leaves = collectLeaves(node);
    const score = matchScore(query, [node.name, ...leaves.slice(0, 24)]);
    if (score <= 0) continue;
    items.push({
      score,
      item: {
        id: `cat:${node.name}`,
        kind: 'category',
        title: localizeCategory(node.name, tCategories),
        subtitle: countLabel(leaves.length),
        href: `/services?cat=${encodeURIComponent(node.name)}`,
        meta: `${leaves.length}`,
      },
    });
  }

  return items
    .sort((a, b) => b.score - a.score)
    .slice(0, CATEGORY_LIMIT)
    .map((i) => i.item);
}

function buildSuggestions(
  tCategories: (key: string) => string,
  countLabel: (count: number) => string
): SearchGroup[] {
  const db = dbSnapshot();

  const categories: SearchItem[] = TAXONOMY.slice(0, 6).map((node) => ({
    id: `cat:${node.name}`,
    kind: 'category' as const,
    title: localizeCategory(node.name, tCategories),
    subtitle: countLabel(collectLeaves(node).length),
    href: `/services?cat=${encodeURIComponent(node.name)}`,
  }));

  const promos: SearchItem[] = db.users
    .filter((u) => u.providerStatus === 'approved' && u.provider && u.status === 'active' && activePromotion(u.provider.promotion))
    .slice(0, 3)
    .map((u) => {
      const promo = activePromotion(u.provider!.promotion)!;
      return {
        id: u.id,
        kind: 'promotion' as const,
        title: `${u.firstName} ${u.lastName}`,
        subtitle: u.provider!.category,
        href: `/services/${u.id}`,
        image: promo.image || u.provider!.portfolio?.[0] || u.avatar,
        badge: promotionBadge(promo),
      };
    });

  return [
    { key: 'category', items: categories },
    ...(promos.length ? [{ key: 'promotion' as const, items: promos }] : []),
  ];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get('q') ?? '').trim();

  const requested = (searchParams.get('locale') ?? '').trim() as Locale;
  const locale: Locale = locales.includes(requested) ? requested : 'fr';

  const tCategories = await getTranslations({ locale, namespace: 'categories' });
  const tSearch = await getTranslations({ locale, namespace: 'search' });
  const countLabel = (count: number) => tSearch('categoryCount', { count });

  if (!raw) {
    return NextResponse.json({ query: '', groups: buildSuggestions(tCategories, countLabel), total: 0 });
  }

  const db = dbSnapshot();

  // ---- Providers (services + live promotions) -------------------------
  const providers = db.users.filter(
    (u) => u.providerStatus === 'approved' && u.provider && u.status === 'active'
  );

  const scoredProviders = providers
    .map((u) => {
      const p = u.provider!;
      const promo = activePromotion(p.promotion);
      const score = matchScore(raw, [
        `${u.firstName} ${u.lastName}`,
        p.title,
        p.category,
        p.description,
        ...(p.specialties ?? []),
      ]);
      return { u, p, promo, score };
    })
    .filter((row) => row.score > 0);

  const services: SearchItem[] = [];
  const promos: SearchItem[] = [];

  for (const row of scoredProviders.sort((a, b) => b.score - a.score)) {
    const { u, p, promo } = row;
    const base: SearchItem = {
      id: u.id,
      kind: 'service',
      title: `${u.firstName} ${u.lastName}`,
      subtitle: p.title || p.category,
      href: `/services/${u.id}`,
      image: p.portfolio?.[0] || u.avatar,
      meta: p.category,
    };
    if (promo && promos.length < PROMO_LIMIT) {
      promos.push({ ...base, kind: 'promotion', badge: promotionBadge(promo) });
      continue;
    }
    if (services.length < SERVICE_LIMIT) services.push(base);
    if (services.length >= SERVICE_LIMIT && promos.length >= PROMO_LIMIT) break;
  }

  // ---- Categories ------------------------------------------------------
  const categories = buildCategoryItems(raw, tCategories, countLabel);

  // ---- News (published only) ------------------------------------------
  const news: SearchItem[] = db.news
    .filter((n) => n.status === 'published')
    .map((n) => ({
      item: {
        id: n.id,
        kind: 'news' as const,
        title: n.title,
        subtitle: n.summary,
        href: `/news/${n.id}`,
        image: n.image,
        meta: n.category,
      },
      score: matchScore(raw, [n.title, n.summary, n.category, n.neighborhood, ...(n.tags ?? [])]),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, SECONDARY_LIMIT)
    .map((r) => r.item);

  // ---- Communities -----------------------------------------------------
  const communities: SearchItem[] = db.communities
    .map((c) => ({
      item: {
        id: c.id,
        kind: 'community' as const,
        title: c.name,
        subtitle: c.description,
        href: `/communities/${c.id}`,
        image: c.cover,
        meta: c.category,
      },
      score: matchScore(raw, [c.name, c.description, c.category]),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, SECONDARY_LIMIT)
    .map((r) => r.item);

  // ---- Activities (public + open) --------------------------------------
  const activities: SearchItem[] = db.activities
    .filter((a) => a.visibility === 'public' && a.status === 'open')
    .map((a) => ({
      item: {
        id: a.id,
        kind: 'activity' as const,
        title: a.title,
        subtitle: a.description,
        href: `/activities/${a.id}`,
        meta: a.category,
      },
      score: matchScore(raw, [a.title, a.description, a.category, a.location]),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, SECONDARY_LIMIT)
    .map((r) => r.item);

  const groups: SearchGroup[] = [];
  if (promos.length) groups.push({ key: 'promotion', items: promos });
  if (services.length) groups.push({ key: 'service', items: services });
  if (categories.length) groups.push({ key: 'category', items: categories });
  if (news.length) groups.push({ key: 'news', items: news });
  if (communities.length) groups.push({ key: 'community', items: communities });
  if (activities.length) groups.push({ key: 'activity', items: activities });

  const total = groups.reduce((sum, g) => sum + g.items.length, 0);

  return NextResponse.json({ query: raw, groups, total });
}
