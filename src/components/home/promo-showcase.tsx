'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight, Percent } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { SectionHeader } from '@/components/ui/section-header';
import { PromotionCard, PromotionCardSkeleton } from '@/components/services/marketing-cards';
import type { ServiceListing } from '@/components/services/service-views';

/**
 * Dedicated promotions band.
 *
 * Everything displayed here comes from the live promotion records
 * (discount, original/promotional price, end date) — nothing is invented.
 */
export function PromoShowcase({
  items,
  loading,
  onRequest,
}: {
  items: ServiceListing[];
  loading: boolean;
  onRequest: (item: ServiceListing) => void;
}) {
  const t = useTranslations('home');

  if (!loading && items.length === 0) return null;

  return (
    <section aria-labelledby="home-promos" className="relative overflow-hidden rounded-[2rem] bg-peach-50 px-4 py-8 sm:px-6 md:rounded-[2.5rem] md:py-10">
      <div
        className="pointer-events-none absolute -end-16 -top-20 h-56 w-56 rounded-full bg-sunset-300/25 blur-3xl"
        aria-hidden
      />
      <div className="relative">
        {/* On phones the CTA drops under the title: keeping it on the same
            row squeezed the heading below its longest word and made the
            page overflow horizontally.                                      */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sunset-500 to-sunset-600 text-white shadow-sunset" aria-hidden>
              <Percent size={21} strokeWidth={2.5} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="home-promos" className="break-words font-display text-[1.6rem] font-semibold leading-tight text-ink-900 sm:text-3xl">
                {t('sectionPromotions')}
              </h2>
              <p className="mt-1 break-words text-[14px] text-ink-500">{t('sectionPromotionsSubtitle')}</p>
            </div>
          </div>
          <Link
            href="/promotions"
            className="inline-flex max-w-full shrink-0 self-start items-center gap-2 rounded-full bg-sunset-500 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sunset transition-colors hover:bg-sunset-600 sm:self-auto"
          >
            <span className="min-w-0 break-words">{t('viewAllPromotions')}</span>
            <ArrowRight size={14} className="flip-rtl shrink-0" aria-hidden />
          </Link>
        </div>

        {loading ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <PromotionCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            {/* Mobile: swipeable row */}
            <div className="-mx-4 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {items.map((p) => (
                <div key={p.id} className="w-[78vw] max-w-[300px] shrink-0 snap-start">
                  <PromotionCard item={p} onRequest={onRequest} />
                </div>
              ))}
            </div>
            {/* Desktop: grid */}
            <div className="mt-6 hidden grid-cols-1 gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((p) => (
                <PromotionCard key={p.id} item={p} onRequest={onRequest} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
