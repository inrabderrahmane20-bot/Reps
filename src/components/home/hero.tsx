'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Percent, Search } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { openGlobalSearch } from '@/lib/open-search';
import type { ServiceListing } from '@/components/services/service-views';
import { BrandMark } from '@/components/layout/brand';

export function Hero({
  promos,
  providerCount,
  promoCount,
  categoryCount,
}: {
  promos: ServiceListing[];
  providerCount: number;
  promoCount: number;
  categoryCount: number;
}) {
  const t = useTranslations('home');
  const locale = useLocale();
  const lead = promos[0];
  const image = lead?.promotion?.image || lead?.portfolio?.[0] || lead?.avatar;
  const inset = promos[1]?.promotion?.image || promos[1]?.portfolio?.[0] || promos[1]?.avatar;
  const title = t('heroTitle');
  const accent = locale === 'fr' ? 'aujourd’hui ?' : locale === 'en' ? 'today?' : 'اليوم؟';
  const accentStart = title.lastIndexOf(accent);
  const trustItems = t('heroTrust').split(' · ');
  const stats = [
    { value: providerCount, label: t('heroStatProviders') },
    { value: promoCount, label: t('heroStatPromotions') },
    { value: categoryCount, label: t('heroStatCategories'), featured: true },
  ];

  return (
    <section className="home-hero">
      {/* Immersive background — the existing public asset, unchanged. */}
      <div className="home-hero-bg" aria-hidden>
        <Image
          src="/homepage_background.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="home-hero-scrim" aria-hidden />

      <div className="home-container home-hero-grid">
        <div className="home-hero-copy">
          <h1>
            {accentStart >= 0 ? (
              <>
                {title.slice(0, accentStart)}
                <span>{title.slice(accentStart)}</span>
              </>
            ) : title}
          </h1>
          <p className="home-hero-lead">{t('heroSubtitle')}</p>

          <div className="home-hero-actions">
            <button type="button" onClick={openGlobalSearch} className="home-button home-button-primary">
              <Search size={19} aria-hidden />
              {t('heroCtaSearch')}
            </button>
            <Link href="/promotions" className="home-button home-button-dark">
              <Percent size={19} aria-hidden />
              {t('heroCtaPromotions')}
            </Link>
          </div>

          <ul className="home-trust-list">
            {trustItems.map((item) => (
              <li key={item}>
                <Check size={16} aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="home-hero-visual">
          <div className="home-hero-art">
            <div className="home-hero-photo">
              {image ? (
                <Image
                  src={image}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 899px) 90vw, 40vw"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="home-hero-inset" aria-hidden>
              {inset ? <Image src={inset} alt="" fill sizes="160px" className="object-cover" /> : null}
            </div>
            <div className="home-seal" aria-hidden>
              <svg viewBox="0 0 100 100">
                <defs>
                  <path id="home-seal-circle" d="M 50,50 m -37,0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" />
                </defs>
                <text>
                  <textPath href="#home-seal-circle">ANNABID • النابض • </textPath>
                </text>
              </svg>
              <span className="home-seal-mark"><BrandMark className="home-seal-logo" /></span>
            </div>
          </div>
          <dl className="home-stat-grid">
            {stats.map((stat) => (
              <div key={stat.label} className={stat.featured ? 'home-stat-card home-stat-featured' : 'home-stat-card'}>
                <dt>{stat.value}</dt>
                <dd>{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
