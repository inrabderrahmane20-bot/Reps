'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search as SearchIcon } from 'lucide-react';
import { NewsCard } from '@/components/cards/news-card';
import { CommunityCard } from '@/components/cards/community-card';
import { ActivityCard } from '@/components/cards/activity-card';
import { ProviderCard } from '@/components/cards/provider-card';
import { EmptyState } from '@/components/ui/empty-state';
import { api } from '@/lib/api-client';

function matches(query: string, ...fields: (string | undefined)[]) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((field) => field?.toLowerCase().includes(q));
}

export function SearchResults() {
  const searchParams = useSearchParams();
  const t = useTranslations('search');
  const [query, setQuery] = useState(searchParams.get('q') ?? '');

  const [providers, setProviders] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    api.get<{ providers: any[] }>('/providers').then((r) => setProviders(r.providers));
    api.get<{ news: any[] }>('/news').then((r) => setNews(r.news));
    api.get<{ communities: any[] }>('/communities').then((r) => setCommunities(r.communities));
    api.get<{ activities: any[] }>('/activities').then((r) => setActivities(r.activities));
  }, []);

  const results = useMemo(() => {
    const q = query;
    return {
      services: providers.filter((p) => matches(q, `${p.firstName} ${p.lastName}`, p.provider?.category, p.provider?.title, ...(p.provider?.specialties ?? []))),
      news: news.filter((n) => matches(q, n.title, n.category, n.neighborhood, n.summary)),
      communities: communities.filter((c) => matches(q, c.name, c.category, c.description)),
      activities: activities.filter((a) => matches(q, a.title, a.category, a.location, a.description)),
    };
  }, [query, providers, news, communities, activities]);

  const totalResults = results.services.length + results.news.length + results.communities.length + results.activities.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <h1 className="font-display text-3xl font-semibold text-ink-900">{t('title')}</h1>

      <div className="mt-6 flex max-w-2xl items-center gap-2 rounded-full bg-white px-4 py-3 shadow-card">
        <SearchIcon size={18} className="shrink-0 text-ink-500" />
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('placeholder')}
          className="w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-300"
        />
      </div>

      {query.trim() && (
        <p className="mt-4 text-sm text-ink-500">
          {t('resultsFor')} <span className="font-semibold text-ink-900">“{query}”</span> · {totalResults} {t('allResults')}
        </p>
      )}

      {totalResults === 0 ? (
        <div className="mt-10">
          <EmptyState icon={SearchIcon} title={t('noResults')} />
        </div>
      ) : (
        <div className="mt-8 space-y-12">
          {results.services.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-xl font-semibold text-ink-900">{t('categoryServices')}</h2>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {results.services.map((p) => (
                  <ProviderCard
                    key={p.id}
                    id={p.id}
                    name={`${p.firstName} ${p.lastName}`}
                    category={p.provider.category}
                    rating={p.rating ?? 0}
                    reviews={p.reviewCount ?? 0}
                    distanceKm={2.5}
                    availability={p.provider.availability}
                    verified={p.providerStatus === 'approved'}
                  />
                ))}
              </div>
            </section>
          )}

          {results.news.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-xl font-semibold text-ink-900">{t('categoryNews')}</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.news.map((n) => (
                  <NewsCard key={n.id} {...n} />
                ))}
              </div>
            </section>
          )}

          {results.communities.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-xl font-semibold text-ink-900">{t('categoryCommunities')}</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {results.communities.map((c) => (
                  <CommunityCard key={c.id} id={c.id} name={c.name} members={c.memberCount} category={c.category} joined={false} onJoin={() => (window.location.href = `/communities/${c.id}`)} />
                ))}
              </div>
            </section>
          )}

          {results.activities.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-xl font-semibold text-ink-900">{t('categoryActivities')}</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.activities.map((a) => (
                  <ActivityCard key={a.id} id={a.id} title={a.title} category={a.category} date={a.date} location={a.location} participants={a.participants} max={a.max} onJoin={() => (window.location.href = `/activities/${a.id}`)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
