import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';
import { readDb } from '@/lib/db';
import { hreflangFor, localizedUrl } from '@/lib/seo';
import { topLevelCategories } from '@/lib/service-categories';

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

interface StaticRoute {
  /** Locale-less path (the root is an empty string). */
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
}

/**
 * Public, indexable routes of the marketplace. Everything that requires an
 * account (`/profile`, `/messages`, `/provider/*`), the admin back-office and
 * the internal search results are intentionally left out.
 */
const STATIC_ROUTES: StaticRoute[] = [
  { path: '', changeFrequency: 'daily', priority: 1 },
  { path: '/services', changeFrequency: 'daily', priority: 0.9 },
  { path: '/promotions', changeFrequency: 'daily', priority: 0.7 },
  { path: '/news', changeFrequency: 'daily', priority: 0.8 },
  { path: '/communities', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/activities', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/meetings', changeFrequency: 'daily', priority: 0.6 },
  { path: '/map', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/discover', changeFrequency: 'daily', priority: 0.8 },
  { path: '/search', changeFrequency: 'weekly', priority: 0.5 },
];

/** Category browse pages — one per top-level family of the taxonomy. */
const CATEGORY_ROUTES: StaticRoute[] = topLevelCategories().map((category) => ({
  path: `/services?cat=${encodeURIComponent(category)}`,
  changeFrequency: 'weekly',
  priority: 0.6,
}));

/** The sitemap is refreshed hourly so newly approved services show up quickly. */
export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  const db = readDb();

  // Only providers that are approved *and* active are publicly reachable.
  const providers = db.users.filter(
    (user) =>
      user.providerStatus === 'approved' && user.status === 'active' && user.provider != null
  );

  // Only published articles are publicly reachable.
  const articles = db.news.filter((article) => article.status === 'published');

  for (const locale of locales) {
    for (const route of [...STATIC_ROUTES, ...CATEGORY_ROUTES]) {
      entries.push({
        url: localizedUrl(locale, route.path),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: { languages: hreflangFor(route.path) },
      });
    }

    for (const provider of providers) {
      const path = `/services/${provider.id}`;
      entries.push({
        url: localizedUrl(locale, path),
        lastModified: provider.createdAt,
        changeFrequency: 'weekly',
        priority: 0.5,
        alternates: { languages: hreflangFor(path) },
      });
    }

    for (const article of articles) {
      const path = `/news/${article.id}`;
      entries.push({
        url: localizedUrl(locale, path),
        lastModified: article.date,
        changeFrequency: 'weekly',
        priority: 0.6,
        alternates: { languages: hreflangFor(path) },
      });
    }
  }

  return entries;
}
