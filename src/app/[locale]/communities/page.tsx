import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { CommunityCard } from '@/components/cards/community-card';
import { communities } from '@/data/mock';

export default function CommunitiesPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = useTranslations('communities');

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-900">{t('title')}</h1>
          <p className="mt-1.5 max-w-xl text-sm text-ink-500">{t('subtitle')}</p>
        </div>
        <button
          type="button"
          className="rounded-full bg-majorelle-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-majorelle-700"
        >
          {t('createGroup')}
        </button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {[...communities, ...communities].map((c, i) => (
          <CommunityCard key={`${c.id}-${i}`} {...c} />
        ))}
      </div>
    </div>
  );
}
