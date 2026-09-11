'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ProviderCard } from '@/components/cards/provider-card';
import { GlobalSearchBar } from '@/components/search/global-search-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { PackageSearch } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { ZONES, getZone } from '@/lib/zones';
import { Link } from '@/i18n/navigation';
import type { PublicUser } from '@/lib/types';

type ProviderRow = PublicUser & { rating: number | null; reviewCount: number; distanceKm: number | null; zoneId?: string };

const categories = ['Plumbing', 'Electricity', 'Cleaning', 'Painting', 'Photography', 'Moving'];

export default function ServicesPage() {
  const t = useTranslations('services');
  const z = useTranslations('zones');
  const { user } = useAuth();
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [zone, setZone] = useState<string>('all');
  const [loaded, setLoaded] = useState(false);

  // Read ?q= on first mount (e.g. arriving from the homepage category
  // drilldown) without needing useSearchParams()/Suspense.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const initialQ = new URLSearchParams(window.location.search).get('q');
    if (initialQ) setQ(initialQ);
  }, []);

  // Auto-select the user's saved zone once the session loads.
  useEffect(() => {
    if (user?.zoneId) setZone((current) => (current === 'all' ? user.zoneId! : current));
  }, [user?.zoneId]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (q) params.set('q', q);
    if (zone && zone !== 'all') params.set('zone', zone);
    if (user?.homeLat != null && user.homeLng != null) {
      params.set('lat', String(user.homeLat));
      params.set('lng', String(user.homeLng));
    }
    api.get<{ providers: ProviderRow[] }>(`/providers?${params.toString()}`).then((r) => {
      setProviders(r.providers);
      setLoaded(true);
    });
  }, [category, q, zone, user?.homeLat, user?.homeLng]);

  const activeZone = getZone(zone);
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of providers) map[p.zoneId || ''] = (map[p.zoneId || ''] || 0) + 1;
    return map;
  }, [providers]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
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

      {/* Zone filter */}
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setZone('all')}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            zone === 'all' ? 'bg-clay-400 text-white' : 'bg-white text-ink-700 hover:bg-sand-100'
          }`}
        >
          {z('all')}
        </button>
        {ZONES.map((zr) => (
          <button
            key={zr.id}
            type="button"
            onClick={() => setZone(zr.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              zone === zr.id ? 'bg-clay-400 text-white' : 'bg-white text-ink-700 hover:bg-sand-100'
            }`}
          >
            {zr.name}
            {(counts[zr.id] ?? 0) > 0 && <span className="ml-1.5 text-xs opacity-70">{counts[zr.id]}</span>}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory(null)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            !category ? 'bg-majorelle-600 text-white' : 'bg-white text-ink-700 hover:bg-sand-100'
          }`}
        >
          {t('category')} · All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              category === cat ? 'bg-majorelle-600 text-white' : 'bg-white text-ink-700 hover:bg-sand-100'
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
            distanceKm={p.distanceKm ?? null}
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