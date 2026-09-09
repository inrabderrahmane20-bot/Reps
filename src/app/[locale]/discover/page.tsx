'use client';

import { useEffect, useState } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { NewsCard } from '@/components/cards/news-card';
import { CommunityCard } from '@/components/cards/community-card';
import { ActivityCard } from '@/components/cards/activity-card';
import { ProviderCard } from '@/components/cards/provider-card';
import { GlobalSearchBar } from '@/components/search/global-search-bar';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';

export default function DiscoverPage() {
  const { user } = useAuth();
  const [news, setNews] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);

  useEffect(() => {
    api.get<{ news: any[] }>('/news').then((r) => setNews(r.news.slice(0, 3)));
    api.get<{ communities: any[] }>('/communities').then((r) => setCommunities(r.communities.slice(0, 4)));
    api.get<{ activities: any[] }>('/activities').then((r) => setActivities(r.activities.slice(0, 3)));
    api.get<{ providers: any[] }>('/providers').then((r) => setProviders(r.providers.slice(0, 4)));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <h1 className="font-display text-3xl font-semibold text-ink-900">Discover</h1>
      <p className="mt-1.5 max-w-xl text-sm text-ink-500">
        Not sure what you're looking for? Browse everything happening around you.
      </p>
      <div className="mt-6 max-w-2xl">
        <GlobalSearchBar placeholder="Search services, news, communities, activities…" submitLabel="Search" />
      </div>

      <div className="mt-12 space-y-14">
        <section>
          <SectionHeader title="Local news" seeAllHref="/news" seeAllLabel="See all" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((item) => (
              <NewsCard key={item.id} {...item} />
            ))}
          </div>
        </section>
        <section>
          <SectionHeader title="Communities" seeAllHref="/communities" seeAllLabel="See all" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {communities.map((c) => (
              <CommunityCard key={c.id} id={c.id} name={c.name} members={c.memberCount} category={c.category} joined={!!user && c.memberIds.includes(user.id)} onJoin={() => (window.location.href = `/communities/${c.id}`)} />
            ))}
          </div>
        </section>
        <section>
          <SectionHeader title="Activities" seeAllHref="/activities" seeAllLabel="See all" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activities.map((a) => (
              <ActivityCard key={a.id} id={a.id} title={a.title} category={a.category} date={a.date} location={a.location} participants={a.participants} max={a.max} onJoin={() => (window.location.href = `/activities/${a.id}`)} />
            ))}
          </div>
        </section>
        <section>
          <SectionHeader title="Services" seeAllHref="/services" seeAllLabel="See all" />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {providers.map((p) => (
              <ProviderCard key={p.id} id={p.id} name={`${p.firstName} ${p.lastName}`} category={p.provider.category} rating={p.rating ?? 0} reviews={p.reviewCount ?? 0} distanceKm={2.4} availability={p.provider.availability} verified={p.providerStatus === 'approved'} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
