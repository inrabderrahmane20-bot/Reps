'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Percent, ShoppingBag, Search, SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { RequestServiceModal } from '@/components/ui/request-service-modal';
import { PromotionCard, PromotionCardSkeleton } from '@/components/services/marketing-cards';
import {
  DEFAULT_PROMO_FILTERS,
  PromoFiltersPanel,
  type PromoCategoryFacet,
  type PromoFiltersState,
  type PromoPriceRange,
} from '@/components/promotions/promo-filters';
import { PromoFilterDrawer } from '@/components/promotions/promo-filter-drawer';
import { PromoActiveFilters } from '@/components/promotions/promo-active-filters';
import { PromoSortSelect, type PromoSort } from '@/components/promotions/promo-sort-select';
import { api } from '@/lib/api-client';
import type { PublicUser, PromotionInfo } from '@/lib/types';
import type { ServiceListing } from '@/components/services/service-views';

type ProviderRow = PublicUser & {
  rating: number | null;
  reviewCount: number;
  distanceKm: number | null;
  zoneId?: string;
  promotion?: PromotionInfo | null;
  prices?: { original: number | null; current: number | null; discountPercent: number | null; discountAmount: number | null } | null;
};

type PromotionsResponse = {
  providers: ProviderRow[];
  total: number;
  categories: PromoCategoryFacet[];
  priceRange: PromoPriceRange;
};

const PAGE_SIZE = 24;

function toListing(p: ProviderRow): ServiceListing {
  return {
    id: p.id,
    name: `${p.firstName} ${p.lastName}`,
    category: p.provider!.category,
    title: p.provider!.title,
    rating: p.rating,
    reviewCount: p.reviewCount,
    availability: p.provider!.availability,
    distanceKm: p.distanceKm,
    verified: p.providerStatus === 'approved',
    avatar: p.avatar,
    description: p.provider!.description,
    priceRange: p.provider!.priceRange,
    portfolio: p.provider!.portfolio,
    zoneId: p.zoneId,
    promotion: p.promotion ?? null,
  };
}

export default function PromotionsPage() {
  const t = useTranslations('promotions');
  const common = useTranslations('common');

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState<PromoFiltersState>(DEFAULT_PROMO_FILTERS);
  const [sort, setSort] = useState<PromoSort>('discount');

  const [items, setItems] = useState<ServiceListing[]>([]);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState<PromoCategoryFacet[]>([]);
  const [priceRange, setPriceRange] = useState<PromoPriceRange>({ min: null, max: null });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [requesting, setRequesting] = useState<ServiceListing | null>(null);

  // Debounce the free-text query (150 ms) so we do not hammer the API.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 150);
    return () => clearTimeout(id);
  }, [query]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (filters.cat) params.set('cat', filters.cat);
    if (filters.minDiscount !== null) params.set('minDiscount', String(filters.minDiscount));
    if (filters.maxDiscount !== null) params.set('maxDiscount', String(filters.maxDiscount));
    if (filters.minPrice !== null) params.set('minPrice', String(filters.minPrice));
    if (filters.maxPrice !== null) params.set('maxPrice', String(filters.maxPrice));
    params.set('sort', sort);
    return params.toString();
  }, [debouncedQuery, filters, sort]);

  const [reloadToken, setReloadToken] = useState(0);

  // A single request key per (query, filters, sort) combination. Re-running
  // the effect with the same key is a no-op, so React's development
  // double-mount does not fire a duplicate request.
  const requestKey = `${queryString}|${reloadToken}`;
  const lastKeyRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  // First page — refetched whenever the query, the filters or the sort change.
  useEffect(() => {
    if (lastKeyRef.current === requestKey) return;
    lastKeyRef.current = requestKey;
    const id = ++requestIdRef.current;

    setLoading(true);
    setError(false);

    fetch(`/api/promotions?${queryString}&limit=${PAGE_SIZE}`, {
      credentials: 'same-origin',
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('request failed');
        return (await res.json()) as PromotionsResponse;
      })
      .then((data) => {
        if (id !== requestIdRef.current) return;
        setItems(data.providers.map(toListing));
        setTotal(data.total);
        setFacets(data.categories ?? []);
        setPriceRange(data.priceRange ?? { min: null, max: null });
      })
      .catch(() => {
        if (id !== requestIdRef.current) return;
        setError(true);
      })
      .finally(() => {
        if (id === requestIdRef.current) setLoading(false);
      });
  }, [requestKey, queryString]);

  const loadMore = useCallback(async () => {
    if (loadingMore || items.length >= total) return;
    const id = requestIdRef.current;
    const key = requestKey;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/promotions?${queryString}&limit=${PAGE_SIZE}&offset=${items.length}`, {
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('request failed');
      const data = (await res.json()) as PromotionsResponse;
      // Ignore the page if the filters changed while it was in flight.
      if (id !== requestIdRef.current || key !== requestKey) return;
      setItems((prev) => [...prev, ...data.providers.map(toListing)]);
      setTotal(data.total);
    } catch {
      if (id !== requestIdRef.current) return;
      setError(true);
    } finally {
      setLoadingMore(false);
    }
  }, [items.length, loadingMore, queryString, requestKey, total]);

  const resetAll = useCallback(() => {
    setFilters(DEFAULT_PROMO_FILTERS);
    setQuery('');
    setDebouncedQuery('');
    setSort('discount');
  }, []);

  const activeFilterCount =
    (filters.cat ? 1 : 0) +
    (filters.minDiscount !== null || filters.maxDiscount !== null ? 1 : 0) +
    (filters.minPrice !== null || filters.maxPrice !== null ? 1 : 0);

  const hasAnyActive = activeFilterCount > 0 || debouncedQuery.length > 0;

  return (
    <div className="mx-auto max-w-[1720px] px-4 py-8 md:px-6 xl:px-8">
      {/* ------------------------------------------------ Compact header */}
      <header className="relative overflow-hidden rounded-[1.75rem] border border-sunset-200/70 bg-gradient-to-br from-peach-50 via-white to-peach-50 px-5 py-6 sm:px-7 sm:py-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -end-16 -top-20 h-56 w-56 rounded-full bg-sunset-300/25 blur-3xl"
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sunset-500 to-sunset-600 text-white shadow-sunset"
                aria-hidden
              >
                <Percent size={20} strokeWidth={2.5} />
              </span>
              <h1 className="min-w-0 break-words font-display text-[1.9rem] font-semibold leading-tight text-ink-900 sm:text-4xl">
                {t('title')}
              </h1>
            </div>
            <p className="mt-2 max-w-xl break-words text-[14px] text-ink-500">{t('subtitle')}</p>
          </div>

          {/* Promo-scoped search + live count */}
          <div className="flex w-full min-w-0 flex-col gap-2.5 lg:max-w-md">
            <div className="relative">
              <label htmlFor="promo-search" className="sr-only">
                {t('searchLabel')}
              </label>
              <Search
                size={17}
                aria-hidden
                className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-ink-400"
              />
              <input
                id="promo-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="h-12 w-full min-w-0 rounded-full border border-ink-900/10 bg-white ps-11 pe-11 text-[15px] text-ink-900 shadow-card outline-none transition-colors placeholder:text-ink-400 focus:border-sunset-400 focus:ring-2 focus:ring-sunset-200"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label={t('clearSearch')}
                  className="absolute end-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-sand-100 text-ink-500 transition-colors hover:bg-sand-200 hover:text-ink-900"
                >
                  <X size={14} aria-hidden />
                </button>
              )}
            </div>
            {!loading && !error && (
              <p className="px-1 text-[13px] font-medium text-ink-500" aria-live="polite">
                <span className="font-display text-base font-semibold text-sunset-700">{total}</span>{' '}
                {t('offersCount')}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* ------------------------------------------------ Body */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
        {/* Desktop filters */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-[1.5rem] border border-ink-900/[0.07] bg-white p-5 shadow-card">
            <h2 className="mb-4 font-display text-base font-semibold text-ink-900">{t('filters')}</h2>
            <PromoFiltersPanel
              value={filters}
              onChange={setFilters}
              onReset={resetAll}
              facets={facets}
              priceRange={priceRange}
            />
          </div>
        </aside>

        <div className="min-w-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] font-medium text-ink-500" aria-live="polite">
              {loading
                ? common('loading')
                : t('resultsCount', { count: total, offers: total === 1 ? t('offer') : t('offers') })}
            </p>
            <div className="flex items-center gap-2">
              <PromoSortSelect value={sort} onChange={setSort} hasQuery={debouncedQuery.length > 0} />
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-ink-900/10 bg-white px-3.5 text-[13px] font-semibold text-ink-800 transition-colors hover:bg-sand-100 lg:hidden"
              >
                <SlidersHorizontal size={15} aria-hidden />
                {t('filters')}
                {activeFilterCount > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-sunset-500 px-1 text-[11px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Active filters */}
          <PromoActiveFilters value={filters} onChange={setFilters} onReset={resetAll} />

          {/* Loading */}
          {loading && (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <PromotionCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && items.length === 0 && (
            <div className="mt-6 rounded-2xl border border-clay-200 bg-clay-50 p-6 text-center">
              <p className="text-sm text-ink-700">{common('somethingWentWrong')}</p>
              <button
                type="button"
                onClick={() => setReloadToken((n) => n + 1)}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-sunset-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-sunset-600"
              >
                <RotateCcw size={15} aria-hidden />
                {common('tryAgain')}
              </button>
            </div>
          )}

          {/* No results for the current filters */}
          {!loading && !error && items.length === 0 && (
            <div className="mt-8">
              {hasAnyActive ? (
                <EmptyState
                  icon={Search}
                  title={t('noResultsTitle')}
                  body={t('noResultsBody')}
                  action={
                    <button
                      type="button"
                      onClick={resetAll}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-sunset-500 px-5 text-sm font-semibold text-white shadow-sunset transition-colors hover:bg-sunset-600"
                    >
                      <RotateCcw size={15} aria-hidden />
                      {t('resetFilters')}
                    </button>
                  }
                />
              ) : (
                <EmptyState icon={ShoppingBag} title={t('emptyTitle')} body={t('emptyBody')} />
              )}
            </div>
          )}

          {/* Results */}
          {!loading && !error && items.length > 0 && (
            <>
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {items.map((item) => (
                  <PromotionCard key={item.id} item={item} onRequest={setRequesting} />
                ))}
              </div>

              {items.length < total && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink-900/10 bg-white px-6 text-sm font-semibold text-ink-800 shadow-card transition-colors hover:bg-sand-100 disabled:opacity-60"
                  >
                    {loadingMore ? common('loading') : t('loadMore')}
                  </button>
                </div>
              )}
            </>
          )}

          <p className="mt-10 border-t border-ink-900/[0.06] pt-6 text-center text-sm text-ink-400">
            {t('moreSoon')}
          </p>
        </div>
      </div>

      {drawerOpen && (
        <PromoFilterDrawer
          value={filters}
          onChange={setFilters}
          onReset={resetAll}
          onClose={() => setDrawerOpen(false)}
          facets={facets}
          priceRange={priceRange}
        />
      )}

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
