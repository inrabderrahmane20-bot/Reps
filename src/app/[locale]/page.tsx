'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { GlobalSearchBar } from '@/components/search/global-search-bar';
import { ServiceCategoryDrilldown } from '@/components/home/service-category-drilldown';
import { CommunityCard } from '@/components/cards/community-card';
import { ProviderCard } from '@/components/cards/provider-card';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';

export default function HomePage() {
  const t = useTranslations('home');
  const { user } = useAuth();

  const [communities, setCommunities] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);

  function loadAll() {
    api.get<{ communities: any[] }>('/communities').then((r) => setCommunities(r.communities.slice(0, 4)));
    api.get<{ providers: any[] }>('/providers').then((r) => setProviders(r.providers.slice(0, 6)));
  }
  useEffect(loadAll, []);

  async function toggleJoinCommunity(id: string) {
    if (!user) return (window.location.href = '/login');
    await api.post(`/communities/${id}/join`);
    loadAll();
  }

  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink-900/10 bg-majorelle-700 bg-zellige">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-wide text-saffron-400">
            {user ? `${t('heroKicker')} · ${user.firstName}` : t('heroKicker')}
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-tight text-white md:text-5xl">{t('heroTitle')}</h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-majorelle-100">{t('heroSubtitle')}</p>

          <div className="mt-8 max-w-2xl">
            <GlobalSearchBar placeholder={t('searchPlaceholder')} submitLabel={t('searchButton')} />
          </div>

          <div className="mt-4 max-w-3xl">
            <ServiceCategoryDrilldown />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-majorelle-100">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
              <MapPin size={14} /> {user?.city || 'Marrakech'}
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-14 px-4 py-12 md:px-8">
        <section>
          <SectionHeader title={t('sectionServices')} seeAllHref="/services" seeAllLabel={t('seeAll')} />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {providers.map((p) => (
              <ProviderCard
                key={p.id}
                id={p.id}
                name={`${p.firstName} ${p.lastName}`}
                category={p.provider.category}
                rating={p.rating ?? 0}
                reviews={p.reviewCount ?? 0}
                distanceKm={2.3}
                availability={p.provider.availability}
                verified={p.providerStatus === 'approved'}
              />
            ))}
          </div>
        </section>

        <section>
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
    </div>
  );
}
