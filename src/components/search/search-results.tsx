'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search as SearchIcon } from 'lucide-react';
import { NewsCard } from '@/components/cards/news-card';
import { CommunityCard } from '@/components/cards/community-card';
import { ActivityCard } from '@/components/cards/activity-card';
import { ProviderCard } from '@/components/cards/provider-card';
import { MeetingProfileCard } from '@/components/cards/meeting-profile-card';
import { EmptyState } from '@/components/ui/empty-state';
import { newsItems, communities, activities, providers, meetingProfiles } from '@/data/mock';

function matches(query: string, ...fields: (string | undefined)[]) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((field) => field?.toLowerCase().includes(q));
}

export function SearchResults() {
  const searchParams = useSearchParams();
  const t = useTranslations('search');
  const [query, setQuery] = useState(searchParams.get('q') ?? '');

  const results = useMemo(() => {
    const q = query;
    return {
      services: providers.filter((p) => matches(q, p.name, p.category, p.title, ...(p.specialties ?? []))),
      news: newsItems.filter((n) => matches(q, n.title, n.category, n.neighborhood, n.summary)),
      communities: communities.filter((c) => matches(q, c.name, c.category, c.description)),
      activities: activities.filter((a) => matches(q, a.title, a.category, a.location, a.description)),
      meetings: meetingProfiles.filter((m) =>
        matches(q, m.name, m.city, m.lookingFor, ...m.sharedInterests)
      ),
    };
  }, [query]);

  const totalResults =
    results.services.length +
    results.news.length +
    results.communities.length +
    results.activities.length +
    results.meetings.length;

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
          {t('resultsFor')} <span className="font-semibold text-ink-900">“{query}”</span> ·{' '}
          {totalResults} {t('allResults')}
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
              <h2 className="mb-4 font-display text-xl font-semibold text-ink-900">
                {t('categoryServices')}
              </h2>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {results.services.map((p) => (
                  <ProviderCard key={p.id} {...p} />
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
              <h2 className="mb-4 font-display text-xl font-semibold text-ink-900">
                {t('categoryCommunities')}
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {results.communities.map((c) => (
                  <CommunityCard key={c.id} {...c} />
                ))}
              </div>
            </section>
          )}

          {results.activities.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-xl font-semibold text-ink-900">
                {t('categoryActivities')}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.activities.map((a) => (
                  <ActivityCard key={a.id} {...a} />
                ))}
              </div>
            </section>
          )}

          {results.meetings.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-xl font-semibold text-ink-900">
                {t('categoryMeetings')}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {results.meetings.map((m) => (
                  <MeetingProfileCard key={m.id} {...m} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
