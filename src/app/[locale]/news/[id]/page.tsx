import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, Share2, Bookmark } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { NewsCard } from '@/components/cards/news-card';
import { newsItems } from '@/data/mock';

export function generateStaticParams() {
  return newsItems.map((item) => ({ id: item.id }));
}

export default async function NewsArticlePage({
  params,
}: {
  params: { id: string };
}) {
  const article = newsItems.find((item) => item.id === params.id);
  if (!article) notFound();

  const t = await getTranslations('news');
  const common = await getTranslations('common');
  const related = newsItems.filter((item) => item.id !== article.id).slice(0, 2);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
      <Link
        href="/news"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-majorelle-700 hover:text-majorelle-800"
      >
        <ChevronLeft size={16} className="flip-rtl" />
        {t('backToNews')}
      </Link>

      <div className="mt-5 flex items-center gap-2">
        <span className="rounded-full bg-majorelle-600/10 px-2.5 py-1 text-[11px] font-semibold text-majorelle-700">
          {article.category}
        </span>
        <span className="text-xs text-ink-500">
          {article.neighborhood} · {article.date}
        </span>
      </div>

      <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-ink-900 md:text-4xl">
        {article.title}
      </h1>

      <p className="mt-3 text-sm text-ink-500">
        {t('publishedBy')} <span className="font-medium text-ink-700">{article.author}</span>
      </p>

      <div className="relative mt-6 h-56 w-full overflow-hidden rounded-2xl md:h-96">
        <Image src={article.image} alt="" fill className="object-cover" sizes="(min-width: 768px) 768px, 100vw" />
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink-700 shadow-card hover:bg-sand-100"
        >
          <Share2 size={14} /> {common('share')}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink-700 shadow-card hover:bg-sand-100"
        >
          <Bookmark size={14} /> {common('save')}
        </button>
      </div>

      <div className="prose-medina mt-8 space-y-4">
        {article.content.map((paragraph, i) => (
          <p key={i} className="text-base leading-relaxed text-ink-700">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {article.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-sand-100 px-3 py-1 text-xs font-medium text-ink-700">
            #{tag}
          </span>
        ))}
      </div>

      {related.length > 0 && (
        <div className="mt-14">
          <h2 className="mb-5 font-display text-xl font-semibold text-ink-900">
            {t('relatedArticles')}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {related.map((item) => (
              <NewsCard key={item.id} {...item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
