import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { MapPin, LocateFixed } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { GlobalSearchBar } from '@/components/search/global-search-bar';
import { NewsCard } from '@/components/cards/news-card';
import { CommunityCard } from '@/components/cards/community-card';
import { ActivityCard } from '@/components/cards/activity-card';
import { ProviderCard } from '@/components/cards/provider-card';
import { newsItems, communities, activities, providers } from '@/data/mock';

export default function HomePage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = useTranslations('home');

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-ink-900/10 bg-majorelle-700 bg-zellige">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-wide text-saffron-400">
            {t('heroKicker')}
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-tight text-white md:text-5xl">
            {t('heroTitle')}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-majorelle-100">
            {t('heroSubtitle')}
          </p>

          <div className="mt-8 max-w-2xl">
            <GlobalSearchBar placeholder={t('searchPlaceholder')} submitLabel={t('searchButton')} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-majorelle-100">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
              <MapPin size={14} /> {t('heroKicker')}
              <button type="button" className="ms-1 font-semibold text-white underline underline-offset-2">
                {t('changeCity')}
              </button>
            </span>
            <button type="button" className="inline-flex items-center gap-1.5 text-majorelle-100 hover:text-white">
              <LocateFixed size={14} /> {t('useMyLocation')}
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-14 px-4 py-12 md:px-8">
        {/* Local news */}
        <section>
          <SectionHeader title={t('sectionNews')} seeAllHref="/news" seeAllLabel={t('seeAll')} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {newsItems.map((item) => (
              <NewsCard key={item.id} {...item} />
            ))}
          </div>
        </section>

        {/* Your communities */}
        <section>
          <SectionHeader
            title={t('sectionCommunities')}
            seeAllHref="/communities"
            seeAllLabel={t('seeAll')}
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {communities.map((c) => (
              <CommunityCard key={c.id} {...c} />
            ))}
          </div>
        </section>

        {/* Activities */}
        <section>
          <SectionHeader
            title={t('sectionActivities')}
            seeAllHref="/activities"
            seeAllLabel={t('seeAll')}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activities.map((a) => (
              <ActivityCard key={a.id} {...a} />
            ))}
          </div>
        </section>

        {/* Services */}
        <section>
          <SectionHeader
            title={t('sectionServices')}
            seeAllHref="/services"
            seeAllLabel={t('seeAll')}
          />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {providers.map((p) => (
              <ProviderCard key={p.id} {...p} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
