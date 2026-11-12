'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUpRight, Search } from 'lucide-react';
import { openGlobalSearch } from '@/lib/open-search';

/**
 * Homepage hero.
 *
 * The photograph stays the existing Annabid Marrakech backdrop; the redesign
 * only changes how it is framed (forest scrim, bold headline and a search
 * field that opens the real floating search overlay).
 */
export function Hero({
  providerCount,
  promoCount,
  categoryCount,
}: {
  providerCount: number;
  promoCount: number;
  categoryCount: number;
}) {
  const t = useTranslations('home');
  const locale = useLocale();
  const title = t('heroTitle');
  const accent = locale === 'fr' ? 'aujourd’hui ?' : locale === 'en' ? 'today?' : 'اليوم؟';
  const accentStart = title.lastIndexOf(accent);

  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero-media" aria-hidden>
        <Image
          src="/homepage_background.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="home-hero-img"
        />
      </div>
      <div className="home-hero-bottom-blur" aria-hidden />

      <div className="home-container home-hero-inner">
        <div className="home-hero-copy">
          <span className="home-hero-kicker">
            <span className="home-hero-kicker-dot" aria-hidden />
            {t('heroKicker')}
          </span>

          <h1 id="home-hero-title">
            {accentStart >= 0 ? (
              <>
                {title.slice(0, accentStart)}
                <span>{title.slice(accentStart)}</span>
              </>
            ) : (
              title
            )}
          </h1>

          <p className="home-hero-lead">{t('heroSubtitle')}</p>

          <button
            type="button"
            onClick={() => openGlobalSearch()}
            className="home-search"
            aria-label={t('heroCtaSearch')}
          >
            <span className="home-search-icon" aria-hidden>
              <Search size={19} strokeWidth={2.2} />
            </span>
            <span className="home-search-prompt">{t('searchPrompt')}</span>
            <span className="home-search-go">
              {t('searchButton')}
              <ArrowUpRight size={17} className="flip-rtl" aria-hidden />
            </span>
          </button>

          <ul className="home-hero-meta">
            <li>
              <strong>{providerCount}</strong>
              {t('heroStatProviders')}
            </li>
            <li>
              <strong>{promoCount}</strong>
              {t('heroStatPromotions')}
            </li>
            <li>
              <strong>{categoryCount}</strong>
              {t('heroStatCategories')}
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
