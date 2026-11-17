import { getTranslations } from 'next-intl/server';
import { NewsCard } from '@/components/cards/news-card';
import { readDb } from '@/lib/db';
import { Link } from '@/i18n/navigation';

export const dynamic = 'force-dynamic';
export default async function NewsPage({ params: pendingparams, searchParams: pendingsearchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ category?: string }> }) {
  const params = await pendingparams;
  const searchParams = await pendingsearchParams;

  const t = await getTranslations({ locale: params.locale, namespace: 'news' });
  const common = await getTranslations({ locale: params.locale, namespace: 'common' });
  const search = await getTranslations({ locale: params.locale, namespace: 'search' });
  const articles = (await readDb()).news.filter(article => article.status === 'published');
  const categories = [...new Set(articles.map(article => article.category))];
  const filtered = searchParams.category ? articles.filter(article => article.category === searchParams.category) : articles;
  return <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
    <h1 className="font-display text-3xl font-semibold">{t('title')}</h1>
    <p className="mt-2 text-ink-700">{t('subtitle')}</p>
    <nav className="mt-6 flex flex-wrap gap-3" aria-label={t('title')}>
      {searchParams.category && <Link href="/news" className="underline">{common('cancel')}</Link>}
      {categories.map(category => <Link key={category} href={'/news?category=' + encodeURIComponent(category)} className="rounded-full bg-white px-4 py-2 shadow-card">{category}</Link>)}
    </nav>
    {!filtered.length && <p role="status" className="mt-8">{search('noResults')}</p>}
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(article => <NewsCard key={article.id} {...article} />)}</div>
  </div>;
}
