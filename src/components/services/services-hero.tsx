'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

/** Live heading over the reference-derived watercolor artwork. */
export function ServicesHero({ content = {} }: { content?: Record<string, string> } = {}) {
  const artwork = !content.src || content.src === '/images/services/marrakech-hero-artwork.png' ? '/images/services/marrakech-hero-panoramic.jpg' : content.src;
  const t = useTranslations('services');
  return (
    <section className="svc-hero svc-painted-hero" aria-labelledby="services-hero-title">
      <div className="svc-painted-scene">
        <Image
          src={artwork}
          alt=""
          width={2172}
          height={724}
          priority
          sizes="100vw"
          className="svc-painted-background"
        />
        <div className="svc-painted-copy">
          <span className="svc-hero-kicker">{content.heroKicker ?? t('heroKicker')}</span>
          <h1 id="services-hero-title">{content.heroTitle ?? t('heroTitle')}</h1>
          <span className="svc-hero-underline" aria-hidden="true">
            <svg viewBox="0 0 180 16" fill="none">
              <path d="M3 12C55-1 113 0 177 5" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </span>
          <p className="svc-hero-lead">{content.heroSubtitle ?? t('heroSubtitle')}</p>
        </div>
      </div>
    </section>
  );
}
