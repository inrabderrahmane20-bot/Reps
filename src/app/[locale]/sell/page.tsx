import { getTranslations } from 'next-intl/server';
import { readDb } from '@/lib/db';
import { Link } from '@/i18n/navigation';
import { FavoriteButton } from '@/components/ui/favorite-button';

export const dynamic = 'force-dynamic';
export default async function SellPage({ params: pendingparams, searchParams: pendingsearchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ cat?: string }> }) {
  const params = await pendingparams;
  const searchParams = await pendingsearchParams;

  const t = await getTranslations({ locale: params.locale, namespace: 'sell' });
  const empty = await getTranslations({ locale: params.locale, namespace: 'favorites' });
  const db = await readDb();
  const listings = db.listings.filter(item => item.status === 'available' && db.users.some(user => user.id === item.sellerId && user.status === 'active'));
  const categories = [...new Set(listings.map(item => item.category))];
  const filtered = searchParams.cat ? listings.filter(item => item.category === searchParams.cat) : listings;
  return <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
    <h1 className="font-display text-3xl font-semibold">{t('title')}</h1>
    <p className="mt-2 text-ink-700">{t('subtitle')}</p>
    <nav className="mt-6 flex flex-wrap gap-3">
      <Link href="/sell" className="underline">{t('title')}</Link>
      {categories.map(category => <Link key={category} href={'/sell?cat=' + encodeURIComponent(category)} className="underline">{category}</Link>)}
    </nav>
    {!filtered.length && <p role="status" className="mt-8">{empty('emptySection')}</p>}
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(item => <article key={item.id} className="rounded-2xl bg-white p-5 shadow-card">
      <h2 className="text-xl font-semibold">{item.title}</h2>
      <p className="mt-2">{item.description}</p><p className="mt-3 font-semibold">{new Intl.NumberFormat(params.locale, { style: 'currency', currency: item.currency || 'MAD' }).format(item.price)}</p>
      <p className="mt-2">{item.city}</p><FavoriteButton type="listing" targetId={item.id} meta={{ title: item.title }} />
    </article>)}</div>
  </div>;
}
