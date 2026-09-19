'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { GlobalSearchBar } from '@/components/search/global-search-bar';
import { ServiceCategoryDrilldown } from '@/components/home/service-category-drilldown';
import { CommunityCard } from '@/components/cards/community-card';
import { ServiceListRow, type ServiceListing } from '@/components/services/service-views';
import { RequestServiceModal } from '@/components/ui/request-service-modal';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';

type HomeProvider = {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  providerStatus?: string;
  rating?: number | null;
  reviewCount?: number;
  distanceKm?: number | null;
  provider?: {
    category: string;
    title: string;
    availability: string;
    description?: string;
    priceRange?: string;
    portfolio?: string[];
  };
};

export default function HomePage() {
  const t = useTranslations('home');
  const { user } = useAuth();

  const [communities, setCommunities] = useState<any[]>([]);
  const [providers, setProviders] = useState<HomeProvider[]>([]);
  const [requesting, setRequesting] = useState<ServiceListing | null>(null);

  function loadAll() {
    const params = new URLSearchParams();
    if (user?.zoneId) params.set('zone', user.zoneId);
    if (user?.homeLat != null && user.homeLng != null) {
      params.set('lat', String(user.homeLat));
      params.set('lng', String(user.homeLng));
    }
    api.get<{ communities: any[] }>('/communities').then((r) => setCommunities(r.communities.slice(0, 4)));
    api.get<{ providers: HomeProvider[] }>(`/providers?${params.toString()}&limit=6`).then((r) =>
      setProviders(r.providers)
    );
  }
  useEffect(loadAll, [user?.zoneId, user?.homeLat, user?.homeLng]);

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
    };
  }

  async function toggleJoinCommunity(id: string) {
    if (!user) return (window.location.href = '/login');
    await api.post(`/communities/${id}/join`);
    loadAll();
  }

  return (
    <div>
      <section className="hero-surface relative overflow-hidden">
        {/* Decorative horseshoe arch, cropped at the edge — a single quiet nod to Marrakech architecture */}
        <div
          className="pointer-events-none absolute -end-24 top-1/2 hidden h-[130%] w-[42%] -translate-y-1/2 md:block"
          aria-hidden
        >
          <div className="arch-motif h-full w-full" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-14 md:px-8 md:pb-36 md:pt-20">
          <div className="flex items-center gap-2 text-sm font-medium text-majorelle-100/90">
            <MapPin size={15} className="text-saffron-400" />
            {user ? `${t('heroKicker')} · ${user.firstName}` : t('heroKicker')}
          </div>

          <h1 className="font-display-hero mt-5 max-w-2xl text-[2.75rem] font-semibold leading-[1.05] text-white sm:text-6xl md:text-7xl">
            {t('heroTitle')}
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-majorelle-100/85">
            {t('heroSubtitle')}
          </p>
        </div>
      </section>

      {/* Search + category drilldown float over the hero's lower edge */}
      <div className="relative mx-auto -mt-16 max-w-5xl px-4 md:-mt-20 md:px-8">
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

      <div className="mx-auto max-w-7xl space-y-20 px-4 pb-20 pt-16 md:px-8 md:pt-20">
        <section>
          <SectionHeader title={t('sectionServices')} seeAllHref="/services" seeAllLabel={t('seeAll')} />
          {/* Dense directory rows — same compact language as the Services page */}
          <div className="mt-4 divide-y divide-ink-900/[0.06] overflow-hidden rounded-2xl border border-ink-900/[0.06] bg-sand-50/60">
            {providers.map((p) => (
              <ServiceListRow key={p.id} item={toListing(p)} onRequest={setRequesting} />
            ))}
          </div>
        </section>

        <section className="-mx-4 bg-sand-100/70 px-4 py-14 md:-mx-8 md:px-8 md:rounded-[2.5rem]">
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
        <RequestServiceModal
          providerId={requesting.id}
          category={requesting.category}
          onClose={() => setRequesting(null)}
        />
      )}
    </div>
  );
}
