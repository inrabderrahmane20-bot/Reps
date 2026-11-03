'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { TAXONOMY, collectLeaves, serviceTaxonomyFromTree } from '@/lib/service-categories';
import { api } from '@/lib/api-client';
import type { SearchCategoryNode } from '@/lib/category-tree';
import { categoryIcon, categoryMessageKey } from '@/lib/category-labels';
import { SectionHeader } from '@/components/ui/section-header';

/**
 * Category discovery grid.
 *
 * The list comes straight from the service taxonomy — the same source of truth
 * the marketplace API filters on — so every card deep-links to a working
 * category page. Labels are localised through the `categories` message
 * namespace; the French taxonomy name stays the query parameter.
 */
export function CategoryGrid() {
  const t = useTranslations('home');
  const tCategories = useTranslations('categories');
  const locale = useLocale();
  const [taxonomy, setTaxonomy] = useState(TAXONOMY);

  useEffect(() => {
    api.get<{ categories: SearchCategoryNode[] }>('/categories/tree')
      .then((response) => setTaxonomy(serviceTaxonomyFromTree(response.categories)))
      .catch((error) => console.error('Could not load the current service categories.', error));
  }, []);

  const families = taxonomy.map((node) => ({
    name: node.name,
    label: (() => {
      const localizedLabel = node.labels?.[locale];
      if (localizedLabel && localizedLabel !== node.name) return localizedLabel;
      const key = categoryMessageKey(node.name);
      if (!key) return localizedLabel || node.name;
      try {
        return tCategories(key) || localizedLabel || node.name;
      } catch {
        return localizedLabel || node.name;
      }
    })(),
    icon: categoryIcon(node.name),
    count: collectLeaves(node).length,
  }));

  return (
    <section aria-labelledby="home-categories">
      <SectionHeader
        id="home-categories"
        title={t('sectionCategories')}
        subtitle={t('sectionCategoriesSubtitle')}
        seeAllHref="/services"
        seeAllLabel={t('exploreAllCategories')}
      />

      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {families.map((family) => (
          <li key={family.name}>
            <Link
              href={`/services?cat=${encodeURIComponent(family.name)}`}
              className="group flex h-full flex-col gap-2.5 rounded-2xl border border-ink-900/[0.06] bg-white p-3.5 shadow-card transition-all hover:-translate-y-0.5 hover:border-sunset-300 hover:shadow-float"
            >
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-peach-100 text-xl transition-colors group-hover:bg-sunset-100"
                aria-hidden
              >
                {family.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block break-words font-display text-[14.5px] font-semibold leading-snug text-ink-900 transition-colors group-hover:text-sunset-700">
                  {family.label}
                </span>
                <span className="mt-1 block text-[11.5px] font-medium text-ink-400">
                  {t('categoryCount', { count: family.count })}
                </span>
              </span>
              <span className="mt-auto flex items-center gap-1 text-[12px] font-semibold text-sunset-600 opacity-0 transition-opacity group-hover:opacity-100">
                {tCategories('explore')}
                <ArrowRight size={13} className="flip-rtl" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
