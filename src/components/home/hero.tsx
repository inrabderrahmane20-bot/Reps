'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ArrowRight, MapPin, Percent, Search } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { openGlobalSearch } from '@/lib/open-search';
import { promotionBadge } from '@/lib/marketing';
import type { ServiceListing } from '@/components/services/service-views';

/**
 * Homepage hero.
 *
 * The right-hand side is built from *real* data (live promotions and provider
 * portfolios) so the page never shows a stock image or an invented offer.
 */
export function Hero({
  promos,
  firstName,
  providerCount,
  promoCount,
  categoryCount,
}: {
  promos: ServiceListing[];
  firstName?: string;
  providerCount: number;
  promoCount: number;
  categoryCount: number;
}) {
  const t = useTranslations('home');
  const nav = useTranslations('nav');

  const lead = promos[0];
  const secondary = promos.slice(1, 3);

  const stats = [
    { value: providerCount, label: t('heroStatProviders') },
    { value: promoCount, label: t('heroStatPromotions') },
    { value: categoryCount, label: t('heroStatCategories') },
  ];

  return (
    <section className="hero-surface relative overflow-hidden">
      {/* Decorative horseshoe arch, cropped at the edge — a quiet nod to Marrakech architecture */}
      <div className="pointer-events-none absolute -end-32 top-1/2 hidden h-[135%] w-[46%] -translate-y-1/2 lg:block" aria-hidden>
        <div className="arch-motif h-full w-full" />
      </div>
      <div
        className="pointer-events-none absolute -start-24 -top-28 h-72 w-72 rounded-full bg-sunset-500/25 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-[1720px] items-center gap-10 px-4 pb-16 pt-10 md:px-6 md:pb-20 md:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-14 lg:pb-24 lg:pt-20 xl:px-8">
        {/* ---------------------------- Copy ---------------------------- */}
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[13px] font-medium text-white/90 backdrop-blur">
            <MapPin size={14} className="text-amber-300" aria-hidden />
            {firstName ? `${t('heroKicker')} · ${firstName}` : t('heroKicker')}
          </div>

          <h1 className="font-display-hero mt-5 max-w-2xl text-[2.6rem] font-semibold leading-[1.06] text-white sm:text-6xl md:text-[4rem]">
            {t('heroTitle')}
          </h1>

          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-white/85 md:text-lg">
            {t('heroSubtitle')}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openGlobalSearch}
              className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-sunset-700 shadow-float transition-transform hover:-translate-y-0.5 hover:bg-peach-50"
            >
              <Search size={17} strokeWidth={2.4} aria-hidden />
              {t('heroCtaSearch')}
            </button>
            <Link
              href="/promotions"
              className="inline-flex min-h-[52px] items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 text-[15px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              <Percent size={17} strokeWidth={2.4} aria-hidden />
              {t('heroCtaPromotions')}
            </Link>
          </div>

          <p className="mt-5 text-[13px] text-white/60">{t('heroTrust')}</p>

          {/* Live counters — only real numbers taken from the API */}
          <dl className="mt-8 grid max-w-lg grid-cols-3 gap-2 sm:gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/15 bg-white/[0.07] px-2.5 py-3 backdrop-blur-sm sm:px-3">
                <dt className="font-display text-2xl font-semibold leading-none text-white">{stat.value}</dt>
                <dd className="mt-1.5 break-words text-[11.5px] leading-snug text-white/65">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ------------------------ Featured services ------------------------ */}
        <div className="mx-auto grid w-full max-w-[520px] gap-3 lg:max-w-none">
          {lead ? (
            <Link
              href={`/services/${lead.id}`}
              className="group block min-w-0 overflow-hidden rounded-[1.5rem] border border-white/30 bg-white shadow-float transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand-100 sm:aspect-[16/10] lg:aspect-[4/3]">
                <HeroImage item={lead} />
                <span className="absolute start-3 top-3 inline-flex items-center gap-1 rounded-full bg-sunset-500 px-2.5 py-1 text-[11.5px] font-bold text-white shadow-sunset">
                  <Percent size={12} strokeWidth={2.6} aria-hidden />
                  {lead.promotion ? promotionBadge(lead.promotion) : ''}
                </span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-peach-100 font-display font-semibold text-sunset-700">
                  {lead.avatar ? (
                    <Image src={lead.avatar} alt="" width={40} height={40} className="h-full w-full object-cover" />
                  ) : (
                    lead.name.charAt(0)
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-[15px] font-semibold text-ink-900">{lead.name}</span>
                  <span className="block truncate text-[12.5px] text-ink-500">{lead.category}</span>
                </span>
                <ArrowRight size={16} className="flip-rtl shrink-0 text-sunset-500 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </div>
            </Link>
          ) : (
            <div className="grid aspect-[4/3] w-full place-items-center rounded-[1.5rem] border border-white/20 bg-white/10 text-sm text-white/70 sm:aspect-[16/10] lg:aspect-[4/3]">
              {t('heroKicker')}
            </div>
          )}

          {secondary.length > 0 && (
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              {secondary.map((item) => (
                <Link
                  key={item.id}
                  href={`/services/${item.id}`}
                  className="group flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl border border-white/30 bg-white px-3 py-3 shadow-float transition-transform duration-300 hover:-translate-y-0.5"
                >
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-peach-100">
                    <HeroImage item={item} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-ink-900">{item.name}</span>
                    <span className="mt-0.5 block truncate text-[11.5px] font-medium text-sunset-700">
                      {item.promotion ? promotionBadge(item.promotion) : item.category}
                    </span>
                  </span>
                  <ArrowRight size={15} className="flip-rtl shrink-0 text-sunset-600" aria-hidden />
                </Link>
              ))}
            </div>
          )}

          <span className="sr-only">{nav('promotions')}</span>
        </div>
      </div>
    </section>
  );
}

function HeroImage({ item }: { item: ServiceListing }) {
  const image = item.promotion?.image || item.portfolio?.[0] || item.avatar;
  if (!image) {
    return (
      <div className="grid h-full w-full place-items-center bg-gradient-to-br from-sunset-200 to-peach-100 font-display text-5xl font-bold text-sunset-600/40">
        {item.name.charAt(0)}
      </div>
    );
  }
  return <Image src={image} alt={item.category} fill sizes="(max-width: 1024px) 100vw, 520px" className="object-cover" />;
}
