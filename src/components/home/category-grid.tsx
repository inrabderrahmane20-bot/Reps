'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUpRight, Image as ImageIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { TAXONOMY, collectLeaves, serviceTaxonomyFromTree } from '@/lib/service-categories';
import { api } from '@/lib/api-client';
import type { SearchCategoryNode } from '@/lib/category-tree';
import { categoryIcon, categoryMessageKey } from '@/lib/category-labels';

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
    <section className="home-categories" aria-labelledby="home-categories-title">
      <div className="home-container">
        <div className="home-section-heading home-section-heading-light" data-tour-target="home-categories">
          <div>
            <h2 id="home-categories-title">{t('sectionCategories')}</h2>
            <p>{t('sectionCategoriesSubtitle')}</p>
          </div>
          <Link href="/services" className="home-button home-category-all">
            {t('exploreAllCategories')}
            <ArrowUpRight size={17} className="flip-rtl" aria-hidden />
          </Link>
        </div>

        {families.length ? (
          <ul className="home-category-list">
            {families.map((family) => (
              <li key={family.name}>
                <Link
                  href={`/services?cat=${encodeURIComponent(family.name)}`}
                  className="home-category-row"
                >
                  <span className="home-category-emoji" aria-hidden>{family.icon}</span>
                  <span className="home-category-name">{family.label}</span>
                  <span className="home-category-count">{t('categoryCount', { count: family.count })}</span>
                  <span className="home-category-photo" aria-hidden><ImageIcon size={20} /></span>
                  <span className="home-category-arrow" aria-hidden><ArrowUpRight size={19} className="flip-rtl" /></span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="home-category-empty">{t('emptyCategories')}</p>
        )}
      </div>
    </section>
  );
}
