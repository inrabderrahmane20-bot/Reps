'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal } from 'lucide-react';
import { ProviderCard } from '@/components/cards/provider-card';
import { GlobalSearchBar } from '@/components/search/global-search-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { PackageSearch } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { PublicUser } from '@/lib/types';

type ProviderRow = PublicUser & { rating: number | null; reviewCount: number };

const categories = ['Plumbing', 'Electricity', 'Cleaning', 'Painting', 'Photography', 'Moving'];

export default function ServicesPage() {
  const t = useTranslations('services');
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [loaded, setLoaded] = useState(false);

  // Read ?q= on first mount (e.g. arriving from the homepage category
  // drilldown) without needing useSearchParams()/Suspense.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const initialQ = new URLSearchParams(window.location.search).get('q');
    if (initialQ) setQ(initialQ);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (q) params.set('q', q);
    api.get<{ providers: ProviderRow[] }>(`/providers?${params.toString()}`).then((r) => {
      setProviders(r.providers);
      setLoaded(true);
    });
  }, [category, q]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <h1 className="font-display text-[2.1rem] font-semibold leading-tight text-ink-900 sm:text-4xl">{t('title')}</h1>
      <p className="mt-1.5 max-w-xl text-sm text-ink-500">{t('subtitle')}</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-full bg-white px-4 py-3 shadow-card">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory(null)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            !category ? 'bg-clay-400 text-white' : 'bg-white text-ink-700 hover:bg-sand-100'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              category === cat ? 'bg-clay-400 text-white' : 'bg-white text-ink-700 hover:bg-sand-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {providers.map((p) => (
          <ProviderCard
            key={p.id}
            id={p.id}
            name={`${p.firstName} ${p.lastName}`}
            category={p.provider!.category}
            rating={p.rating ?? 0}
            reviews={p.reviewCount}
            distanceKm={1.5 + Math.random() * 4}
            availability={p.provider!.availability}
            verified={p.providerStatus === 'approved'}
          />
        ))}
      </div>

      {loaded && providers.length === 0 && (
        <div className="mt-8">
          <EmptyState icon={PackageSearch} title={t('empty')} />
        </div>
      )}
    </div>
  );
}
