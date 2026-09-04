'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, SlidersHorizontal } from 'lucide-react';
import { ProviderCard } from '@/components/cards/provider-card';
import { useDemoState } from '@/components/layout/demo-state-provider';
import { providers } from '@/data/mock';

const categories = ['Plumber', 'Electrician', 'House cleaning', 'Painting', 'Air conditioning', 'Gardening', 'Beauty', 'Childcare'];

export default function ServicesPage() {
  const t = useTranslations('services');
  const { state } = useDemoState();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const approvedProviders = state.submissions.filter((item) => item.status === 'approved').map((item) => ({
    id: item.id, name: item.name, category: item.category, title: item.title, rating: 5, reviews: 0,
    distanceKm: 0.8, availability: 'available' as const, verified: true, description: item.description,
    serviceArea: item.serviceArea, priceRange: item.priceRange,
  }));
  const allProviders = [...providers, ...approvedProviders];
  const visibleProviders = useMemo(() => allProviders.filter((provider) => {
    const matchesCategory = activeCategory === 'All' || provider.category === activeCategory;
    const haystack = `${provider.name} ${provider.category} ${provider.title ?? ''} ${provider.description ?? ''}`.toLowerCase();
    return matchesCategory && haystack.includes(query.toLowerCase().trim());
  }), [activeCategory, query, state.submissions]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <h1 className="font-display text-3xl font-semibold text-ink-900">{t('title')}</h1>
      <p className="mt-1.5 max-w-xl text-sm text-ink-500">{t('subtitle')}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 items-center gap-2 rounded-full bg-white px-4 py-3 shadow-card"><Search size={18} className="text-ink-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchPlaceholder')} className="w-full bg-transparent text-sm outline-none" /></label>
        <button type="button" onClick={() => setFiltersOpen(!filtersOpen)} className="inline-flex items-center justify-center gap-2 rounded-full border border-ink-900/10 bg-white px-5 py-3 text-sm font-semibold text-ink-700 hover:bg-sand-100"><SlidersHorizontal size={16} />{t('filters')}</button>
      </div>
      {filtersOpen && <div className="mt-4 rounded-2xl border border-ink-900/10 bg-white p-4 text-sm text-ink-600">Showing services in Marrakech. Choose a category or search by provider, speciality, or service title.</div>}
      <div className="mt-5 flex flex-wrap gap-2">{['All', ...categories].map((category) => <button key={category} type="button" onClick={() => setActiveCategory(category)} className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${activeCategory === category ? 'bg-clay-400 text-white' : 'bg-white text-ink-700 hover:bg-sand-100'}`}>{category}</button>)}</div>
      <div className="mt-8 grid grid-cols-1 gap-3 lg:grid-cols-2">{visibleProviders.map((provider) => <ProviderCard key={provider.id} {...provider} />)}</div>
      {visibleProviders.length === 0 && <p className="mt-10 rounded-2xl bg-white p-8 text-center text-sm text-ink-500">No services match those filters. Try another category or search.</p>}
    </div>
  );
}
