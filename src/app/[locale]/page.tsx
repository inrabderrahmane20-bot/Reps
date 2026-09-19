'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { GlobalSearchBar } from '@/components/search/global-search-bar';
import { ServiceCategoryDrilldown } from '@/components/home/service-category-drilldown';
import { PopularCategories } from '@/components/home/popular-categories';
import { CommunityCard } from '@/components/cards/community-card';
import { ServiceGridCard, type ServiceListing } from '@/components/services/service-views';
import { SponsoredCard, SponsoredCardSkeleton, PromotionCard, PromotionCardSkeleton } from '@/components/services/marketing-cards';
import { RequestServiceModal } from '@/components/ui/request-service-modal';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import type { PromotionInfo } from '@/lib/types';

type HomeProvider = {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  providerStatus?: string;
  rating?: number | null;
  reviewCount?: number;
  distanceKm?: number | null;
  zoneId?: string;
  sponsored?: boolean;
  promotion?: PromotionInfo | null;
  provider?: {
    category: string;
    title: string;
    availability: string;
    description?: string;
    priceRange?: string;
    portfolio?: string[];
  };
};

function toListing(p: HomeProvider): ServiceListing {
  return {
    id: p.id,
    name: `${p.firstName} ${p.lastName}`,
    category: p.provider?.category ?? '',
    title: p.provider?.title ?? '',
    rating: p.rating ?? null,
    reviewCount: p.reviewCount ?? 0,
    availability: (p.provider?.availability ?? 'later') as ServiceListing['availability'],
    distanceKm: p.distanceKm ?? null,
    verified: p.providerStatus === 'approved',
    avatar: p.avatar ?? '',
    description: p.provider?.description,
    priceRange: p.provider?.priceRange,
    portfolio: p.provider?.portfolio,
    zoneId: p.zoneId,
    sponsored: p.sponsored ?? false,
    promotion: p.promotion ?? null,
  };
}

export default function HomePage() {
  const t = useTranslations('home');
  const { user } = useAuth();

  const [communities, setCommunities] = useState<any[]>([]);
  const [featured, setFeatured] = useState<ServiceListing[]>([]);
  const [sponsored, setSponsored] = useState<ServiceListing[]>([]);
  const [promos, setPromos] = useState<ServiceListing[]>([]);
  const [loadingHome, setLoadingHome] = useState(true);
  const [requesting, setRequesting] = useState<ServiceListing | null>(null);

  function loadAll() {
    const params = new URLSearchParams();
    if (user?.zoneId) params.set('zone', user.zoneId);
    if (user?.homeLat != null && user.homeLng != null) {
      params.set('lat', String(user.homeLat));
      params.set('lng', String(user.homeLng));
    }
    const geo = params.toString() ? `&${params.toString()}` : '';
    setLoadingHome(true);
    api
      .get<{ communities: any[] }>('/communities')
      .then((r) => setCommunities(r.communities.slice(0, 4)));
    api.get<{ providers: HomeProvider[] }>(`/providers?sort=rating&limit=4${geo}`).then((r) => setFeatured(r.providers.map(toListing)));
    api
      .get<{ providers: HomeProvider[] }>('/providers?sponsored=1&sort=sponsored&limit=6')
      .then((r) => setSponsored(r.providers.map(toListing)))
      .catch(() => setSponsored([]));
    api
      .get<{ providers: HomeProvider[] }>('/providers?promotion=1&sort=rating&limit=8')
      .then((r) => setPromos(r.providers.map(toListing)))
      .catch(() => setPromos([]))
      .finally(() => setLoadingHome(false));
  }
  useEffect(loadAll, [user?.zoneId, user?.homeLat, user?.homeLng]);

  async function toggleJoinCommunity(id: string) {
    if (!user) return (window.location.href = '/login');
    await api.post(`/communities/${id}/join`);
    loadAll();
  }

  return (
    <div>
      <section className="hero-surface relative overflow-hidden">
        {/* Decorative horseshoe arch, cropped at the edge — a single quiet nod to Marrakech architecture */}
        <div className="pointer-events-none absolute -end-24 top-1/2 hidden h-[130%] w-[42%] -translate-y-1/2 md:block" aria-hidden>
          <div className="arch-motif h-full w-full" />
        </div>

        <div className="relative mx-auto max-w-[1720px] px-4 pb-28 pt-14 md:px-6 md:pb-36 md:pt-20 xl:px-8">
          <div className="flex items-center gap-2 text-sm font-medium text-majorelle-100/90">
            <MapPin size={15} className="text-saffron-400" />
            {user ? `${t('heroKicker')} · ${user.firstName}` : t('heroKicker')}
          </div>

          <h1 className="font-display-hero mt-5 max-w-2xl text-[2.75rem] font-semibold leading-[1.05] text-white sm:text-6xl md:text-7xl">
            {t('heroTitle')}
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-majorelle-100/85">{t('heroSubtitle')}</p>
        </div>
      </section>

      {/* Search + category drilldown float over the hero's lower edge */}
      <div className="relative mx-auto -mt-16 max-w-5xl px-4 md:-mt-20 md:px-6">
        <div className="rounded-3xl bg-white p-3 shadow-float ring-1 ring-black/5 sm:p-4">
          <GlobalSearchBar
            placeholder={t('searchPlaceholder')}
            submitLabel={t('searchButton')}
            wrapperClassName="flex flex-1 flex-col gap-2 sm:flex-row"
            className="flex flex-1 items-center gap-2.5 rounded-2xl bg-sand-50 px-4 py-3.5"
            inputClassName="w-full bg-transparent text-[15px] text-ink-900 outline-none placeholder:text-ink-300"
            iconClassName="shrink-0 text-ink-500"
            buttonClassName="rounded-2xl bg-clay-400 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-clay-500"
          />
          <div className="mt-3">
            <ServiceCategoryDrilldown />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1720px] space-y-20 px-4 pb-20 pt-16 md:px-6 md:pt-20 xl:px-8">
        {/* Popular categories — directory shortcuts */}
        <section aria-labelledby="home-popular-categories">
          <SectionHeader id="home-popular-categories" title={t('sectionPopularCategories')} />
          <div className="mt-4">
            <PopularCategories />
          </div>
        </section>

        {/* Featured services */}
        <section aria-labelledby="home-featured">
          <SectionHeader id="home-featured" title={t('sectionFeatured')} seeAllHref="/services" seeAllLabel={t('seeAll')} />
          {loadingHome ? (
            <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-44 animate-pulse rounded-2xl bg-sand-100" />
              ))}
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((p) => (
                <ServiceGridCard key={p.id} item={p} onRequest={setRequesting} />
              ))}
            </div>
          )}
        </section>

        {/* Sponsored partners */}
        {sponsored.length > 0 && (
          <section aria-labelledby="home-sponsored">
            <SectionHeader id="home-sponsored" title={t('sectionSponsored')} />
            {loadingHome ? (
              <div className="mt-4 flex gap-3 overflow-hidden">
                {[0, 1, 2].map((i) => (
                  <SponsoredCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:hidden">
                {sponsored.map((p) => (
                  <SponsoredCard key={p.id} item={p} onRequest={setRequesting} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Promotions / Solde */}
        {promos.length > 0 && (
          <section aria-labelledby="home-promos">
            <SectionHeader id="home-promos" title={t('sectionPromotions')} seeAllHref="/promotions" seeAllLabel={t('viewAllPromotions')} />
            {loadingHome ? (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <PromotionCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <>
                {/* Mobile: swipeable, full-bleed row */}
                <div className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {promos.map((p) => (
                    <div key={p.id} className="w-[78vw] max-w-[300px] shrink-0 snap-start">
                      <PromotionCard item={p} onRequest={setRequesting} />
                    </div>
                  ))}
                </div>
                {/* Desktop: grid */}
                <div className="mt-4 hidden grid-cols-1 gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {promos.map((p) => (
                    <PromotionCard key={p.id} item={p} onRequest={setRequesting} />
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {/* Communities */}
        <section className="-mx-4 bg-sand-100/70 px-4 py-14 md:-mx-6 md:px-6 md:rounded-[2.5rem] xl:-mx-8">
          <SectionHeader title={t('sectionCommunities')} seeAllHref="/communities" seeAllLabel={t('seeAll')} />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {communities.map((c) => (
              <CommunityCard
                key={c.id}
                id={c.id}
                name={c.name}
                members={c.memberCount}
                category={c.category}
                joined={!!user && c.memberIds.includes(user.id)}
                onJoin={() => toggleJoinCommunity(c.id)}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Request modal */}
      {requesting && (
        <RequestServiceModal providerId={requesting.id} category={requesting.category} onClose={() => setRequesting(null)} />
      )}
    </div>
  );
}