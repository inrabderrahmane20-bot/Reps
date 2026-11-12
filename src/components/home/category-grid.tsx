'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUpRight, Percent } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { SEARCH_CATEGORIES, type SearchCategoryNode } from '@/lib/category-tree';
import { categoryImage } from '@/lib/category-images';
import {
  countCategoryLeaves,
  homeRootHref,
  homeSectionHref,
  homeSections,
  type HomeRootKind,
  type HomeSection,
} from '@/lib/home-categories';

const KIND_ORDER: HomeRootKind[] = ['services', 'community', 'places', 'for-sale'];

function labelFor(node: SearchCategoryNode, locale: string): string {
  const localized = node.labels?.[locale]?.trim();
  if (localized) return localized;
  const french = node.labels?.fr?.trim();
  if (french) return french;
  return node.labels?.en?.trim() || node.slug || node.id;
}

/**
 * The four photographic discovery cards plus one category section per
 * taxonomy root. Every title, card and link comes from the live
 * `/categories/tree` payload, so admin renames and re-ordering are reflected
 * here automatically.
 */
export function CategoryGrid({ categories }: { categories: SearchCategoryNode[] }) {
  const t = useTranslations('home');
  const locale = useLocale();
  const tree = categories.length ? categories : SEARCH_CATEGORIES;
  const sections = homeSections(tree);
  const byKind = new Map(sections.map((section) => [section.kind, section]));
  const ordered = KIND_ORDER.map((kind) => byKind.get(kind)).filter(
    (section): section is HomeSection => Boolean(section)
  );

  return (
    <div className="home-catalogue">
      <div className="home-container">
        <div className="home-discovery-grid">
          {ordered.map((section) => (
            <Link
              key={section.kind}
              href={homeRootHref(section.kind)}
              className="home-discovery-card"
            >
              <span className="home-discovery-media" aria-hidden>
                <Image
                  src={categoryImage(section.root, section.kind)}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 50vw, 25vw"
                  className="home-discovery-img"
                />
              </span>
              <span className="home-discovery-shade" aria-hidden />
              <span className="home-discovery-body">
                <span className="home-discovery-label">{labelFor(section.root, locale)}</span>
              </span>
              <span className="home-discovery-arrow" aria-hidden>
                <ArrowUpRight size={16} className="flip-rtl" />
              </span>
            </Link>
          ))}
        </div>

        <Link href="/promotions" className="home-offer-banner">
          <span className="home-offer-icon" aria-hidden>
            <Percent size={19} strokeWidth={2.4} />
          </span>
          <span className="home-offer-copy">
            <strong>{t('offersBannerTitle')}</strong>
            <span>{t('offersBannerSubtitle')}</span>
          </span>
          <span className="home-offer-cta">
            {t('offersBannerCta')}
            <ArrowUpRight size={16} className="flip-rtl" aria-hidden />
          </span>
        </Link>

        {ordered.map((section) => {
          const items = section.items.length ? section.items : [section.root];
          const heading = labelFor(section.root, locale);

          return (
            <section
              key={section.kind}
              className="hc-section"
              aria-labelledby={`hc-${section.kind}`}
            >
              <div className="hc-head">
                <div className="hc-head-copy">
                  <h2 id={`hc-${section.kind}`}>{heading}</h2>
                  <span className="hc-rule" aria-hidden />
                </div>
                <Link href={homeRootHref(section.kind)} className="hc-see-all">
                  {t('seeAll')}
                  <ArrowUpRight size={15} className="flip-rtl" aria-hidden />
                </Link>
              </div>

              {section.kind === 'places' ? (
                <p className="hc-subtitle">{t('placesSectionSubtitle')}</p>
              ) : null}

              <ul className="hc-grid">
                {items.map((item, index) => {
                  const count = countCategoryLeaves(item);
                  return (
                    <li key={`${item.id}-${index}`}>
                      <Link href={homeSectionHref(section.kind, item)} className="hc-card">
                        <span className="hc-card-media" aria-hidden>
                          <Image
                            src={categoryImage(item, section.root.slug)}
                            alt=""
                            fill
                            sizes="(max-width: 767px) 45vw, (max-width: 1199px) 30vw, 22vw"
                            className="hc-card-img"
                          />
                        </span>
                        <span className="hc-card-body">
                          <span className="hc-card-name">{labelFor(item, locale)}</span>
                          {count > 1 ? (
                            <span className="hc-card-count">
                              {t('categoryCount', { count })}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
