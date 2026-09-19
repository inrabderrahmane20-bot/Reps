'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Percent, ShoppingBag } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { RequestServiceModal } from '@/components/ui/request-service-modal';
import { PromotionCard, PromotionCardSkeleton } from '@/components/services/marketing-cards';
import { api } from '@/lib/api-client';
import type { PublicUser, PromotionInfo } from '@/lib/types';
import type { ServiceListing } from '@/components/services/service-views';

type ProviderRow = PublicUser & {
  rating: number | null;
  reviewCount: number;
  distanceKm: number | null;
  zoneId?: string;
  promotion?: PromotionInfo | null;
};

function toListing(p: ProviderRow): ServiceListing {
  return {
    id: p.id,
    name: `${p.firstName} ${p.lastName}`,
    category: p.provider!.category,
    title: p.provider!.title,
    rating: p.rating,
    reviewCount: p.reviewCount,
    availability: p.provider!.availability,
    distanceKm: p.distanceKm,
    verified: p.providerStatus === 'approved',
    avatar: p.avatar,
    description: p.provider!.description,
    priceRange: p.provider!.priceRange,
    portfolio: p.provider!.portfolio,
    zoneId: p.zoneId,
    promotion: p.promotion ?? null,
  };
}

export default function PromotionsPage() {
  const tPage = useTranslations('home');
  const t = useTranslations('promotions');
  const common = useTranslations('common');

  const [items, setItems] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [requesting, setRequesting] = useState<ServiceListing | null>(null);

  useEffect(() => {
    api
      .get<{ providers: ProviderRow[]; total: number }>('/providers?promotion=1&sort=rating&limit=24')
      .then((r) => setItems(r.providers.map(toListing)))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const promoCount = items.filter((i) => i.promotion).length;

  return (
    <div className="mx-auto max-w-[1720px] px-4 py-8 md:px-6 xl:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-saffron-500 text-white" aria-hidden>
              <Percent size={20} />
            </span>
            <h1 className="font-display text-[2.1rem] font-semibold leading-tight text-ink-900 sm:text-4xl">{t('title')}</h1>
          </div>
          <p className="mt-1.5 max-w-xl text-sm text-ink-500">{t('subtitle')}</p>
        </div>
        {!loading && !error && promoCount > 0 && (
          <p className="text-sm font-medium text-ink-500">
            <span className="font-display text-lg font-semibold text-saffron-700">{promoCount}</span> {t('offersCount')}
          </p>
        )}
      </div>

      {loading && (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <PromotionCardSkeleton key={i} />
          ))}
        </div>
      )}

      {error && (
        <div className="mt-8 rounded-2xl border border-clay-200 bg-clay-50 p-6 text-center">
          <p className="text-sm text-ink-700">{common('somethingWentWrong')}</p>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="mt-10">
          <EmptyState icon={ShoppingBag} title={t('emptyTitle')} body={t('emptyBody')} />
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {items.map((item) => (
            <PromotionCard key={item.id} item={item} onRequest={setRequesting} />
          ))}
        </div>
      )}

      <p className="mt-10 border-t border-ink-900/[0.06] pt-6 text-center text-sm text-ink-400">
        {t('moreSoon')} · <span className="text-majorelle-600">{tPage('sectionServices')}</span>
      </p>

      {requesting && (
        <RequestServiceModal providerId={requesting.id} category={requesting.category} onClose={() => setRequesting(null)} />
      )}
    </div>
  );
}