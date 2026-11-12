'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowRight,
  ChevronDown,
  PackageSearch,
  Search,
  X,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { RequestServiceModal } from '@/components/ui/request-service-modal';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import type { PublicUser } from '@/lib/types';
import { DEFAULT_FILTERS, type FiltersState } from '@/components/services/filters-panel';
import { SponsoredStrip } from '@/components/services/sponsored-strip';
import { ServiceFinder } from '@/components/services/service-finder';
import { ServicesHero } from '@/components/services/services-hero';
import { CategoryDiscovery, MoroccanDivider } from '@/components/services/category-discovery';
import { homeSectionItems, homeSections } from '@/lib/home-categories';
import { getCategoryLabel, SEARCH_CATEGORIES, type SearchCategoryNode } from '@/lib/category-tree';
import type { PromotionInfo } from '@/lib/types';
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

type ProviderRow = PublicUser & {
  rating: number | null;
  reviewCount: number;
  distanceKm: number | null;
  zoneId?: string;
  sponsored?: boolean;
  sponsoredCampaign?: { placement?: 'home' | 'services' | 'both'; href?: string; priority?: number } | null;
  promotion?: PromotionInfo | null;
};

export default function ServicesPage() {
  const t = useTranslations('services');
  const locale = useLocale();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const { user } = useAuth();

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>('newest');
  const [view, setView] = useState<ViewMode>('list');

  const [providers, setProviders] = useState<ServiceListing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categoryTree, setCategoryTree] = useState<SearchCategoryNode[]>(SEARCH_CATEGORIES);

  const [requesting, setRequesting] = useState<ServiceListing | null>(null);
  const [sponsored, setSponsored] = useState<ServiceListing[]>([]);
  const [sponsoredLoading, setSponsoredLoading] = useState(true);

  const requestSeq = useRef(0);
  const resultsRef = useRef<HTMLElement | null>(null);

  // Read ?q= and ?cat= on first mount for existing service-directory links.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const initialQ = params.get('q');
    if (initialQ) {
      setQ(initialQ);
      setDebouncedQ(initialQ);
      setShowResults(true);
    }
    const initialCat = params.get('cat');
    if (initialCat) {
      setFilters((f) => ({ ...f, cat: initialCat }));
      setShowResults(true);
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

  // Live category tree for the photographic discovery grid. Never hardcoded.
  useEffect(() => {
    let active = true;
    api
      .get<{ categories: SearchCategoryNode[] }>('/categories/tree')
      .then((r) => {
        if (active) setCategoryTree(r.categories ?? []);
      })
      .catch(() => {
        if (active) setCategoryTree(SEARCH_CATEGORIES);
      });
    return () => {
      active = false;
    };
  }, []);

  const serviceCategories = useMemo(() => {
    if (!categoryTree.length) return [];
    const section = homeSections(categoryTree).find((s) => s.kind === 'services');
    if (!section) return categoryTree.slice(0, 12);
    return homeSectionItems(section.root, 'services', 12);
  }, [categoryTree]);

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
    zoneId: p.zoneId,
    sponsored: p.sponsored ?? false,
    sponsoredPlacement: p.sponsoredCampaign?.placement ?? 'both',
    sponsoredHref: p.sponsoredCampaign?.href,
    promotion: p.promotion ?? null,
  }), []);

  // Sponsored placements — a fixed strip above organic results. Campaigns
  // scheduled for the homepage only are filtered out here, and a placement
  // configured with its own destination keeps that link.
  useEffect(() => {
    api
      .get<{ providers: ProviderRow[] }>('/providers?sponsored=1&sort=sponsored&limit=6')
      .then((r) =>
        setSponsored(
          r.providers
            .map(mapRow)
            .filter((p) => p.sponsoredPlacement === 'both' || p.sponsoredPlacement === 'services')
        )
      )
      .catch(() => setSponsored([]))
      .finally(() => setSponsoredLoading(false));
  }, [mapRow]);

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
        // A query that finds nothing is valuable signal for the "Recherche
        // client" section: record it so other clients and providers see it.
        if (r.total === 0 && debouncedQ.trim()) {
          api.post('/client-searches', { query: debouncedQ }).catch(() => {});
          }
      })
      .catch((err) => {
        if (requestSeq.current !== seq) return;
        setError(err?.message ?? 'error');
      })
      .finally(() => {
        if (requestSeq.current === seq) setLoading(false);
      });
  }, [buildQuery, debouncedQ, mapRow]);

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


  function setFiltersMerged(partial: Partial<FiltersState>) {
    setFilters((f) => ({ ...f, ...partial }));
  }

  function resetAll() {
    setQ('');
    setDebouncedQ('');
    setFilters(DEFAULT_FILTERS);
  }

  function scrollToResults() {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function selectCategory(category: string | null) {
    setSelectedGroup(category);
    setShowResults(false);
  }

  const discoverySelection = selectedGroup ?? (serviceCategories[0] ? getCategoryLabel(serviceCategories[0], locale) : null);

  return (
    <div className="moroccan-canvas svc-page min-h-screen pb-16">
      <span className="svc-original-corner" aria-hidden="true" />
      <ServicesHero />

      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        {/* Main search bar */}
        <div className="svc-search-wrap relative z-10" data-tour-target="services-search">
          <form
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              setDebouncedQ(q.trim());
              setShowResults(true);
            }}
            className="svc-search"
          >
            <Search size={20} className="shrink-0 text-emerald-primary" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('searchServices')}
              aria-label={t('searchServices')}
            />
            {q !== '' && (
              <button
                type="button"
                onClick={() => setQ('')}
                aria-label={t('clearSearch')}
                className="svc-search-clear"
              >
                <X size={15} />
              </button>
            )}
            <button type="submit" className="svc-search-btn" aria-label={t('searchButton')}>
              <Search size={16} aria-hidden />
              <span className="hidden sm:inline">{t('searchButton')}</span>
            </button>
          </form>
          <p className="svc-search-hint mt-2 text-xs text-typography-main/50">{t('searchHint')}</p>
        </div>

        <MoroccanDivider />

        <CategoryDiscovery
          categories={serviceCategories}
          selected={discoverySelection}
          onSelect={selectCategory}
        />

        <MoroccanDivider />

        <div className="svc-finder-artwork">
          <span className="svc-original-foliage" aria-hidden="true" />
        <ServiceFinder key={discoverySelection} categories={serviceCategories} selected={discoverySelection} onApply={(cat) => { setFiltersMerged({ cat }); setShowResults(true); requestAnimationFrame(scrollToResults); }} />
        </div>
        <MoroccanDivider />

        {showResults && <div className="svc-professional-results">
          {/* Results */}
          <section
            ref={resultsRef}
            aria-label={t('results')}
            className="min-w-0 scroll-mt-24"
            data-tour-target="services-results"
          >
            <SponsoredStrip items={sponsored} loading={sponsoredLoading} onRequest={setRequesting} />

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-typography-main/70">
                <span className="font-display text-lg font-semibold text-typography-main">{total}</span>{' '}
                {t('resultCount', { count: total })}
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                <SortSelect value={sort} onChange={setSort} />
                <ViewSwitcher value={view} onChange={setView} allowLarge />
              </div>
            </div>

            {/* Skeleton while the first page loads */}
            {loading && providers.length === 0 && (
              <div
                className={`mt-4 space-y-2.5 ${
                  view === 'grid' ? 'grid grid-cols-1 gap-3.5 sm:grid-cols-2 2xl:grid-cols-3' : ''
                }`}
                aria-hidden
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded-2xl bg-beige-secondary/80" />
                ))}
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-2xl border border-terracotta-200 bg-terracotta-50 p-6 text-center">
                <p className="text-sm text-typography-main/75">{t('loadError')}</p>
              </div>
            )}

            {!loading && !error && total === 0 && (
              <div className="mt-6 rounded-2xl border border-gold-muted/40 bg-card-soft px-4 py-8">
                <EmptyState icon={PackageSearch} title={t('empty')} />
                {debouncedQ.trim() !== '' && (
                  <p className="mt-3 text-center text-sm text-typography-main/55">
                    {t('searchRecorded', { query: debouncedQ })}
                  </p>
                )}
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={resetAll}
                    className="rounded-full bg-emerald-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-secondary"
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
                  <div className="svc-results-shell mt-4 divide-y divide-line/80">
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
                  <div className="mt-7 flex justify-center">
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="svc-load-more disabled:opacity-60"
                    >
                      {loadingMore ? t('loadingMore') : t('loadMore')}
                      <ArrowRight size={15} className="flip-rtl" aria-hidden />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>}
      </div>

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
        className="h-9 cursor-pointer appearance-none rounded-full border border-gold-muted/60 bg-card-soft pe-9 ps-3.5 text-[13px] font-semibold text-typography-main/80 outline-none transition-colors hover:bg-selection-state"
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-typography-main/50"
      />
    </div>
  );
}
