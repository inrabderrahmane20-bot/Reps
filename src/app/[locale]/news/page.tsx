import { useTranslations } from 'next-intl';
import { NewsCard } from '@/components/cards/news-card';
import { newsItems } from '@/data/mock';

const categories = [
  'Local Life',
  'Traffic',
  'Transportation',
  'Events',
  'Culture',
  'Sports',
  'New Businesses',
  'Education',
];

export default function NewsPage() {
  const t = useTranslations('news');

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <h1 className="font-display text-3xl font-semibold text-ink-900">{t('title')}</h1>
      <p className="mt-1.5 max-w-xl text-sm text-ink-500">{t('subtitle')}</p>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat, i) => (
          <button
            key={cat}
            type="button"
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              i === 0
                ? 'bg-majorelle-600 text-white'
                : 'bg-white text-ink-700 hover:bg-sand-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[...newsItems, ...newsItems].map((item, i) => (
          <NewsCard key={`${item.id}-${i}`} {...item} />
        ))}
      </div>
    </div>
  );
}
