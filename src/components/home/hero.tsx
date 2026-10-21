'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight, MapPin, Percent, Search, Sparkles } from 'lucide-react';
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

        {/* ------------------------ Layered visuals ------------------------ */}
        <div className="relative mx-auto w-full max-w-[520px] lg:max-w-none">
          <div className="relative aspect-[4/4.4] w-full">
            {/* Back card */}
            {secondary[1] && (
              <div className="absolute bottom-[4%] end-[2%] w-[46%] overflow-hidden rounded-[1.6rem] border border-white/25 bg-white/10 shadow-float backdrop-blur-sm">
                <HeroImage item={secondary[1]} />
              </div>
            )}

            {/* Lead card */}
            {lead ? (
              <Link
                href={`/services/${lead.id}`}
                className="group absolute inset-x-[6%] top-0 block overflow-hidden rounded-[1.9rem] border border-white/30 bg-white/95 shadow-float transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="relative aspect-[4/3.2] w-full overflow-hidden bg-sand-100">
                  <HeroImage item={lead} />
                  <span className="absolute start-3 top-3 inline-flex items-center gap-1 rounded-full bg-sunset-500 px-2.5 py-1 text-[11.5px] font-bold text-white shadow-sunset">
                    <Percent size={12} strokeWidth={2.6} aria-hidden />
                    {lead.promotion ? promotionBadge(lead.promotion) : ''}
                  </span>
                </div>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-peach-100 font-display font-semibold text-sunset-700">
                    {lead.avatar ? (
                      <img src={lead.avatar} alt="" className="h-full w-full object-cover" loading="lazy" />
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
              <div className="absolute inset-x-[6%] top-0 h-[62%] rounded-[1.9rem] border border-white/25 bg-white/10 backdrop-blur-sm" />
            )}

            {/* Floating promo chip */}
            {secondary[0] && (
              <Link
                href={`/services/${secondary[0].id}`}
                className="absolute bottom-[16%] start-0 flex max-w-[62%] items-center gap-2.5 rounded-2xl border border-white/40 bg-white/95 px-3.5 py-2.5 shadow-float transition-transform duration-300 hover:-translate-y-1"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-peach-100 text-sunset-600">
                  <Sparkles size={16} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-ink-900">{secondary[0].name}</span>
                  <span className="block truncate text-[11.5px] font-medium text-sunset-600">
                    {secondary[0].promotion ? promotionBadge(secondary[0].promotion) : secondary[0].category}
                  </span>
                </span>
              </Link>
            )}

            <span className="sr-only">{nav('promotions')}</span>
          </div>
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
  return <img src={image} alt={item.category} className="h-full w-full object-cover" loading="lazy" />;
}
