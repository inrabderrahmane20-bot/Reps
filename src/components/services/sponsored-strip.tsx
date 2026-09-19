'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { ServiceListing } from './service-views';
import { SponsoredCard, SponsoredCardSkeleton } from './marketing-cards';
import { trackProvider } from '@/lib/track-insight';

/**
 * Horizontal sponsored strip shown above organic results. Scrollable with
 * snap on every breakpoint — swipe-friendly on touch, remains a compact row
 * on desktop so it never steals result width.
 */
export function SponsoredStrip({
  items,
  loading,
  onRequest,
}: {
  items: ServiceListing[];
  loading: boolean;
  onRequest: (item: ServiceListing) => void;
}) {
  const t = useTranslations('services');

  // Paid placements should count views — fire an impression per placement once.
  useEffect(() => {
    if (!loading) {
      items.forEach((p) => trackProvider(p.id, 'impressions'));
    }
    // Only on first load of a given strip content.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  if (!loading && items.length === 0) return null;

  return (
    <section aria-label={t('sponsoredSection')} className={loading ? undefined : 'rounded-2xl border border-ink-900/[0.06] bg-gradient-to-b from-majorelle-50 to-sand-50 p-4'}>
      <h2 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-widest text-majorelle-700">
        {t('sponsoredSection')}
        <span className="h-px flex-1 bg-majorelle-600/15" aria-hidden />
      </h2>
      {loading ? (
        <div className="mt-3 flex gap-3 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <SponsoredCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="-mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:hidden">
          {items.map((p) => (
            <SponsoredCard key={p.id} item={p} onRequest={onRequest} />
          ))}
          {/* end fade hint on wide screens */}
          <div className="hidden w-8 shrink-0 md:block" aria-hidden />
        </div>
      )}
    </section>
  );
}