'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { SectionHeader } from '@/components/ui/section-header';
import { Hero } from '@/components/home/hero';
import { CategoryGrid } from '@/components/home/category-grid';
import { PromoShowcase } from '@/components/home/promo-showcase';
import { CommunityCard } from '@/components/cards/community-card';
import { ServiceGridCard, type ServiceListing } from '@/components/services/service-views';
import { SponsoredCard, SponsoredCardSkeleton } from '@/components/services/marketing-cards';
import { RequestServiceModal } from '@/components/ui/request-service-modal';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import { topLevelCategories } from '@/lib/service-categories';
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
  sponsoredCampaign?: { placement?: 'home' | 'services' | 'both'; href?: string; priority?: number } | null;
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
    sponsoredPlacement: p.sponsoredCampaign?.placement ?? 'both',
    sponsoredHref: p.sponsoredCampaign?.href,
    promotion: p.promotion ?? null,
  };
}

export default function HomePage() {
  const t = useTranslations('home');
  const { user } = useAuth();

  const [communities, setCommunities] = useState<any[]>([]);
  const [featured, setFeatured] = useState<ServiceListing[]>([]);
  const [availableNow, setAvailableNow] = useState<ServiceListing[]>([]);
  const [sponsored, setSponsored] = useState<ServiceListing[]>([]);
  const [promos, setPromos] = useState<ServiceListing[]>([]);
  const [providerTotal, setProviderTotal] = useState(0);
  const [promoTotal, setPromoTotal] = useState(0);
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
      .then((r) => setCommunities(r.communities.slice(0, 4)))
      .catch(() => setCommunities([]));

    // Total number of live providers — used for the honest hero counters.
    api
      .get<{ providers: HomeProvider[]; total: number }>('/providers?limit=1')
      .then((r) => setProviderTotal(r.total ?? 0))
      .catch(() => setProviderTotal(0));

    // Best rated — ranked by the real review average.
    api
      .get<{ providers: HomeProvider[] }>(`/providers?sort=rating&limit=8${geo}`)
      .then((r) => setFeatured(r.providers.map(toListing)))
      .catch(() => setFeatured([]));

    // Currently available providers.
    api
      .get<{ providers: HomeProvider[] }>(`/providers?availability=available&sort=available&limit=8${geo}`)
      .then((r) => setAvailableNow(r.providers.map(toListing)))
      .catch(() => setAvailableNow([]));

    api
      .get<{ providers: HomeProvider[] }>('/providers?sponsored=1&sort=sponsored&limit=6')
      .then((r) =>
        setSponsored(
          r.providers
            .map(toListing)
            // A campaign configured for the services page only must not appear here.
            .filter((p) => p.sponsoredPlacement === 'both' || p.sponsoredPlacement === 'home')
        )
      )
      .catch(() => setSponsored([]));

    api
      .get<{ providers: HomeProvider[]; total: number }>('/providers?promotion=1&sort=rating&limit=8')
      .then((r) => {
        setPromos(r.providers.map(toListing));
        setPromoTotal(r.total ?? 0);
      })
      .catch(() => {
        setPromos([]);
        setPromoTotal(0);
      })
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
      <Hero
        promos={promos}
        firstName={user?.firstName}
        providerCount={providerTotal}
        promoCount={promoTotal}
        categoryCount={topLevelCategories().length}
      />

      <div className="mx-auto max-w-[1720px] space-y-16 px-4 pb-20 pt-12 md:px-6 md:space-y-20 md:pt-16 xl:px-8">
        {/* Promotions — high on the page, real discounts only */}
        <PromoShowcase items={promos} loading={loadingHome} onRequest={setRequesting} />

        {/* Category discovery */}
        <CategoryGrid />

        {/* Best rated providers */}
        <section aria-labelledby="home-best-rated">
          <SectionHeader
            id="home-best-rated"
            title={t('sectionBestRated')}
            subtitle={t('sectionBestRatedSubtitle')}
            seeAllHref="/services?sort=rating"
            seeAllLabel={t('seeAll')}
          />
          {loadingHome ? (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-44 animate-pulse rounded-2xl bg-sand-100" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((p) => (
                <ServiceGridCard key={p.id} item={p} onRequest={setRequesting} />
              ))}
            </div>
          )}
        </section>

        {/* Available right now */}
        {availableNow.length > 0 && (
          <section aria-labelledby="home-available">
            <SectionHeader
              id="home-available"
              title={t('sectionAvailableNow')}
              subtitle={t('sectionAvailableNowSubtitle')}
              seeAllHref="/services?availability=available"
              seeAllLabel={t('seeAll')}
            />
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {availableNow.map((p) => (
                <ServiceGridCard key={p.id} item={p} onRequest={setRequesting} />
              ))}
            </div>
          </section>
        )}

        {/* Sponsored partners — transparently labelled */}
        {sponsored.length > 0 && (
          <section aria-labelledby="home-sponsored">
            <SectionHeader id="home-sponsored" title={t('sectionSponsored')} />
            {loadingHome ? (
              <div className="flex gap-3 overflow-hidden">
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

        {/* Communities */}
        <section aria-labelledby="home-communities" className="-mx-4 bg-sand-100/70 px-4 py-12 md:-mx-6 md:px-6 md:rounded-[2.5rem] xl:-mx-8">
          <SectionHeader
            id="home-communities"
            title={t('sectionCommunities')}
            subtitle={t('sectionCommunitiesSubtitle')}
            seeAllHref="/communities"
            seeAllLabel={t('seeAll')}
          />
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
