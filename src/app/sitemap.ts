import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';
import { readDb } from '@/lib/db';
import { hreflangFor, localizedUrl } from '@/lib/seo';
import { normalizeCategory } from '@/lib/service-categories';
import { flattenServiceCategories, serviceRoots, serviceCategoryHref } from '@/lib/services-browser';
import { categoryBranchValues } from '@/lib/service-selection';
import { getCategoryTree } from '@/lib/category-store';

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
];

/** Category browse pages — one per top-level family of the taxonomy. */
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const roots = serviceRoots(await getCategoryTree());
  const db = await readDb();
  const publicCategories = new Set(db.users.filter(user=>user.providerStatus==='approved' && user.status==='active' && user.provider).map(user=>normalizeCategory(user.provider!.category)));
  const categoryRoutes: StaticRoute[] = flattenServiceCategories(roots).filter(node=>node.children?.length || Array.from(categoryBranchValues(node)).some(value=>publicCategories.has(value))).map(node=>({path:serviceCategoryHref(roots,node.id),changeFrequency:'weekly',priority:0.6}));

  // Only providers that are approved *and* active are publicly reachable.
  const providers = db.users.filter(
    (user) =>
      user.providerStatus === 'approved' && user.status === 'active' && user.provider != null
  );

  // Only published articles are publicly reachable.
  const articles = db.news.filter((article) => article.status === 'published');

  for (const locale of locales) {
    for (const route of [...STATIC_ROUTES, ...categoryRoutes]) {
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
