'use client';

'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Percent, Search } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { openGlobalSearch } from '@/lib/open-search';
import { BrandMark } from '@/components/layout/brand';

export function Hero({
  providerCount,
  promoCount,
  categoryCount,
}: {
  providerCount: number;
  promoCount: number;
  categoryCount: number;
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = useTranslations('home');
  const locale = useLocale();
  const title = t('heroTitle');
  const accent = locale === 'fr' ? 'aujourd’hui ?' : locale === 'en' ? 'today?' : 'اليوم؟';
  const accentStart = title.lastIndexOf(accent);
  const trustItems = t('heroTrust').split(' · ');
  const stats = [
    { value: providerCount, label: t('heroStatProviders') },
    { value: promoCount, label: t('heroStatPromotions') },
    { value: categoryCount, label: t('heroStatCategories'), featured: true },
  ];

  useEffect(() => () => {
    if (animationTimer.current) clearTimeout(animationTimer.current);
  }, []);

  function animateArtwork() {
    setIsAnimating(true);
    if (animationTimer.current) clearTimeout(animationTimer.current);
    animationTimer.current = setTimeout(() => setIsAnimating(false), 550);
  }

  return (
    <section className="home-hero">
      {/* The hero photograph is painted by CSS so it can stay fixed while
          the page content scrolls over it. */}
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
          <button
            type="button"
            className={`home-hero-art${isAnimating ? ' home-hero-art--clicked' : ''}`}
            onClick={animateArtwork}
            aria-label={title}
          >
            <div className="home-hero-photo" aria-hidden>
              <Image
                src="/bighp.png"
                alt=""
                fill
                priority
                sizes="(max-width: 899px) 150vw, 70vw"
                className="object-contain"
              />
            </div>
            <div className="home-hero-inset" aria-hidden>
              <Image
                src="/smallhp.png"
                alt=""
                fill
                sizes="(max-width: 899px) 30vw, 16vw"
                className="object-contain"
              />
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
          </button>
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
