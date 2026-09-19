'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PackageSearch, Search, SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { RequestServiceModal } from '@/components/ui/request-service-modal';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { getZone } from '@/lib/zones';
import { topLevelCategories } from '@/lib/service-categories';
import { Link } from '@/i18n/navigation';
import type { PublicUser } from '@/lib/types';
import {
  FiltersPanel,
  DEFAULT_FILTERS,
  type FiltersState,
} from '@/components/services/filters-panel';
import { MobileFilterDrawer } from '@/components/services/mobile-filter-drawer';
import {
  ServiceListRow,
  ServiceGridCard,
  ServiceLargeCard,
  ViewSwitcher,
  type ServiceListing,
  type ViewMode,
} from '@/components/services/service-views';

const PAGE_SIZE = 24;
type SortKey = 'newest' | 'rating' | 'available' | 'alpha';

type ProviderRow = PublicUser & { rating: number | null; reviewCount: number; distanceKm: number | null };

export default function ServicesPage() {
  const t = useTranslations('services');
  const z = useTranslations('zones');
  const { user } = useAuth();

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>('newest');
  const [view, setView] = useState<ViewMode>('list');

  const [providers, setProviders] = useState<ServiceListing[]>([]);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [requesting, setRequesting] = useState<ServiceListing | null>(null);

  const requestSeq = useRef(0);

  // Read ?q= on first mount (homepage category drilldown sends it there).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const initialQ = new URLSearchParams(window.location.search).get('q');
    if (initialQ) {
      setQ(initialQ);
      setDebouncedQ(initialQ);
    }
  }, []);

  // Auto-select the user's saved zone once the session loads.
  useEffect(() => {
    if (user?.zoneId) setFilters((f) => (f.zone === 'all' ? { ...f, zone: user.zoneId! } : f));
  }, [user?.zoneId]);

  // Debounce the search box.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);

  const buildQuery = useCallback(
    (offset: number) => {
      const params = new URLSearchParams();
      if (debouncedQ) params.set('q', debouncedQ);
      if (filters.cat) params.set('cat', filters.cat);
      if (filters.availability.length > 0) params.set('availability', filters.availability.join(','));
      if (filters.minRating != null) params.set('minRating', String(filters.minRating));
      if (filters.zone && filters.zone !== 'all') params.set('zone', filters.zone);
      if (user?.homeLat != null && user.homeLng != null) {
        params.set('lat', String(user.homeLat));
        params.set('lng', String(user.homeLng));
      }
      params.set('sort', sort);
      params.set('limit', String(PAGE_SIZE));
      if (offset > 0) params.set('offset', String(offset));
      return params;
    },
    [debouncedQ, filters.cat, filters.availability, filters.minRating, filters.zone, sort, user?.homeLat, user?.homeLng]
  );

  const mapRow = useCallback((p: ProviderRow): ServiceListing => ({
    id: p.id,
    name: `${p.firstName} ${p.lastName}`,
    category: p.provider!.category,
    title: p.provider!.title,
    rating: p.rating ?? 0,
    reviewCount: p.reviewCount,
    availability: p.provider!.availability,
    distanceKm: p.distanceKm ?? null,
    verified: p.providerStatus === 'approved',
    avatar: p.avatar,
    description: p.provider!.description,
    priceRange: p.provider!.priceRange,
    portfolio: p.provider!.portfolio,
  }), []);

  // Fetch the first page whenever any query dimension changes.
  useEffect(() => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);
    api
      .get<{ providers: ProviderRow[]; total: number }>(`/providers?${buildQuery(0).toString()}`)
      .then((r) => {
        if (requestSeq.current !== seq) return;
        setProviders(r.providers.map(mapRow));
        setTotal(r.total);
        setLoaded(true);
      })
      .catch((err) => {
        if (requestSeq.current !== seq) return;
        setError(err?.message ?? 'error');
        setLoaded(true);
      })
      .finally(() => {
        if (requestSeq.current === seq) setLoading(false);
      });
  }, [buildQuery, mapRow]);

  async function loadMore() {
    const seq = requestSeq.current;
    setLoadingMore(true);
    try {
      const r = await api.get<{ providers: ProviderRow[]; total: number }>(
        `/providers?${buildQuery(providers.length).toString()}`
      );
      if (requestSeq.current !== seq) return;
      setProviders((prev) => [...prev, ...r.providers.map(mapRow)]);
      setTotal(r.total);
    } catch {
      // Keep whatever we already have; the button simply stays available.
    } finally {
      if (requestSeq.current === seq) setLoadingMore(false);
    }
  }

  const hasMore = providers.length < total;
  const activeZone = getZone(filters.zone);
  const hasActiveFilters =
    q.trim() !== '' || filters.cat !== null || filters.availability.length > 0 || filters.minRating != null || filters.zone !== 'all';

  const topCats = useMemo(() => topLevelCategories().slice(0, 8), []);
  const activeTopCat = filters.cat && topCats.includes(filters.cat) ? filters.cat : null;

  function setFiltersMerged(partial: Partial<FiltersState>) {
    setFilters((f) => ({ ...f, ...partial }));
  }

  function resetAll() {
    setQ('');
    setDebouncedQ('');
    setFilters(DEFAULT_FILTERS);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      {/* Header */}
      <h1 className="font-display text-[2.1rem] font-semibold leading-tight text-ink-900 sm:text-4xl">{t('title')}</h1>
      <p className="mt-1.5 max-w-xl text-sm text-ink-500">{t('subtitle')}</p>

      {!user && !activeZone && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-sand-100 px-4 py-3">
          <p className="flex-1 text-sm text-ink-700">{z('setZonePrompt')}</p>
          <Link href="/map" className="shrink-0 rounded-full bg-majorelle-600 px-4 py-2 text-xs font-semibold text-white hover:bg-majorelle-700">
            {z('setYourZone')}
          </Link>
        </div>
      )}
      {activeZone && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-sand-100 px-4 py-3">
          <p className="flex-1 text-sm text-ink-700">
            {t('showingInZone')} <span className="font-semibold text-majorelle-700">{activeZone.name}</span>
          </p>
          <Link href="/map" className="shrink-0 rounded-full border border-ink-900/10 px-4 py-2 text-xs font-semibold text-ink-700 hover:bg-white">
            {z('change')}
          </Link>
        </div>
      )}

      {/* Dedicated service search */}
      <div className="mt-6 lg:mt-8">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('searchServices')}
            aria-label={t('searchServices')}
            className="w-full rounded-2xl border border-ink-900/[0.08] bg-white py-3.5 pe-12 ps-11 text-[15px] text-ink-900 shadow-card outline-none transition-colors placeholder:text-ink-300 focus:border-majorelle-500"
          />
          {q !== '' && (
            <button
              type="button"
              onClick={() => setQ('')}
              aria-label={t('clearSearch')}
              className="absolute end-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-ink-500 transition-colors hover:bg-sand-100 hover:text-ink-900"
            >
              <X size={15} />
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-ink-500">{t('searchHint')}</p>
      </div>

      {/* Mobile: category chips + filter drawer trigger */}
      <div className="mt-4 flex items-center gap-2 lg:hidden">
        <div className="-mx-4 flex flex-1 gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setFiltersMerged({ cat: null })}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              !activeTopCat ? 'bg-majorelle-600 text-white border-majorelle-600' : 'bg-white text-ink-700 border-ink-900/10'
            }`}
          >
            {t('allCategories')}
          </button>
          {topCats.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFiltersMerged({ cat })}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                activeTopCat === cat ? 'bg-majorelle-600 text-white border-majorelle-600' : 'bg-white text-ink-700 border-ink-900/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink-900/10 bg-white text-ink-700 transition-colors hover:bg-sand-100"
          aria-label={t('filters')}
        >
          <SlidersHorizontal size={17} />
          {hasActiveFilters && <span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-saffron-500" aria-hidden />}
        </button>
      </div>

      <div className="mt-5 gap-8 lg:mt-8 lg:grid lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[272px_minmax(0,1fr)]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-[84px] max-h-[calc(100dvh-104px)] overflow-y-auto rounded-2xl border border-ink-900/[0.06] bg-white/70 p-4 shadow-card">
            <FiltersPanel value={filters} onChange={setFilters} onReset={resetAll} />
          </div>
        </aside>

        {/* Results */}
        <section aria-label={t('results')}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-ink-700">
              <span className="font-display text-lg font-semibold text-ink-900">{total}</span>{' '}
              {t('resultCount', { count: total })}
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <SortSelect value={sort} onChange={setSort} />
              <ViewSwitcher value={view} onChange={setView} allowLarge />
            </div>
          </div>

          {/* Skeleton while the first page loads */}
          {loading && providers.length === 0 && (
            <div className={`mt-4 space-y-2.5 ${view === 'grid' ? 'grid grid-cols-1 gap-3.5 sm:grid-cols-2 2xl:grid-cols-3' : ''}`} aria-hidden>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-sand-100" />
              ))}
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl border border-clay-200 bg-clay-50 p-6 text-center">
              <p className="text-sm text-ink-700">{t('loadError')}</p>
            </div>
          )}

          {!loading && !error && total === 0 && (
            <div className="mt-6">
              <EmptyState icon={PackageSearch} title={t('empty')} />
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={resetAll}
                  className="rounded-full bg-majorelle-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-majorelle-700"
                >
                  {t('clearFilters')}
                </button>
              </div>
            </div>
          )}

          {!loading && !error && total > 0 && (
            <>
              {/* LIST */}
              {view === 'list' && (
                <div className="mt-4 divide-y divide-ink-900/[0.06] overflow-hidden rounded-2xl border border-ink-900/[0.06] bg-sand-50/60">
                  {providers.map((p) => (
                    <ServiceListRow key={p.id} item={p} onRequest={setRequesting} />
                  ))}
                </div>
              )}

              {/* GRID */}
              {view === 'grid' && (
                <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 2xl:grid-cols-3">
                  {providers.map((p) => (
                    <ServiceGridCard key={p.id} item={p} onRequest={setRequesting} />
                  ))}
                </div>
              )}

              {/* LARGE */}
              {view === 'large' && (
                <div className="mt-4 space-y-5">
                  {providers.map((p) => (
                    <ServiceLargeCard key={p.id} item={p} onRequest={setRequesting} />
                  ))}
                </div>
              )}

              {hasMore && (
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 rounded-full border border-majorelle-200 bg-white px-6 py-2.5 text-sm font-semibold text-majorelle-700 shadow-card transition-colors hover:bg-majorelle-600 hover:text-white disabled:opacity-60"
                  >
                    {loadingMore ? t('loadingMore') : t('loadMore')}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <MobileFilterDrawer
          value={filters}
          onChange={setFilters}
          onReset={resetAll}
          onClose={() => setDrawerOpen(false)}
        />
      )}

      {/* Request modal */}
      {requesting && (
        <RequestServiceModal
          providerId={requesting.id}
          category={requesting.category}
          onClose={() => setRequesting(null)}
        />
      )}
    </div>
  );
}

function SortSelect({ value, onChange }: { value: SortKey; onChange: (sort: SortKey) => void }) {
  const t = useTranslations('services');
  const options: { key: SortKey; label: string }[] = [
    { key: 'newest', label: t('sortNewest') },
    { key: 'rating', label: t('sortRating') },
    { key: 'available', label: t('sortAvailable') },
    { key: 'alpha', label: t('sortAlpha') },
  ];
  return (
    <div className="relative">
      <label className="sr-only">{t('sort')}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        aria-label={t('sort')}
        className="h-9 cursor-pointer appearance-none rounded-full border border-ink-900/10 bg-white pe-9 ps-3.5 text-[13px] font-semibold text-ink-700 outline-none transition-colors hover:bg-sand-100"
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-ink-500" />
    </div>
  );
}