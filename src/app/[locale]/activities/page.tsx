import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { ActivityCard } from '@/components/cards/activity-card';
import { activities } from '@/data/mock';

export default function ActivitiesPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = useTranslations('activities');

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-900">{t('title')}</h1>
          <p className="mt-1.5 max-w-xl text-sm text-ink-500">{t('subtitle')}</p>
        </div>
        <button
          type="button"
          className="rounded-full bg-clay-400 px-5 py-2.5 text-sm font-semibold text-white hover:bg-clay-500"
        >
          {t('create')}
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...activities, ...activities].map((a, i) => (
          <ActivityCard key={`${a.id}-${i}`} {...a} />
        ))}
      </div>
    </div>
  );
}
