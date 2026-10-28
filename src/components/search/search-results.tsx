'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { ChevronRight, Loader2, Search as SearchIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { EmptyState } from '@/components/ui/empty-state';
import type { SearchGroup, SearchKind } from '@/lib/search-types';

/**
 * Full-page search results.
 *
 * It consumes the very same `/api/search` endpoint as the floating search pill
 * so both surfaces rank identically — there is a single source of truth for
 * the catalogue, and the ~1.5k providers never reach the browser.
 */
export function SearchResults() {
  const searchParams = useSearchParams();
  const t = useTranslations('search');
  const tGroups = useTranslations('floatingSearch');
  const locale = useLocale();
  const router = useRouter();

  const initial = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initial);
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handle = window.setTimeout(async () => {
      const controller = new AbortController();
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}&locale=${encodeURIComponent(locale)}`,
          { signal: controller.signal, credentials: 'same-origin' }
        );
        if (!res.ok) throw new Error('search failed');
        const data = await res.json();
        setGroups(Array.isArray(data.groups) ? data.groups : []);
        setTotal(Number(data.total) || 0);
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        setGroups([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => window.clearTimeout(handle);
  }, [query, locale]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  function groupLabel(key: SearchKind): string {
    switch (key) {
      case 'promotion':
        return tGroups('groupPromotions');
      case 'service':
        return t('categoryServices');
      case 'category':
        return tGroups('groupCategories');
      case 'news':
        return t('categoryNews');
      case 'community':
        return t('categoryCommunities');
      case 'activity':
        return t('categoryActivities');
      default:
        return t('title');
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink-900 sm:text-4xl">{t('title')}</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const q = query.trim();
          router.replace(q ? `/${locale}/search?q=${encodeURIComponent(q)}` : `/${locale}/search`);
        }}
        className="mt-6 flex max-w-2xl items-center gap-2 rounded-full border border-ink-900/10 bg-white px-4 py-2 shadow-card focus-within:border-sunset-300"
      >
        <SearchIcon size={18} className="shrink-0 text-sunset-600" aria-hidden />
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('placeholder')}
          aria-label={t('placeholder')}
          className="w-full bg-transparent py-1.5 text-[15px] text-ink-900 outline-none placeholder:text-ink-300"
        />
        {loading && <Loader2 size={16} className="shrink-0 animate-spin text-ink-400" aria-hidden />}
      </form>

      {query.trim() && (
        <p className="mt-4 text-sm text-ink-500">
          {t('resultsFor')} <span className="font-semibold text-ink-900">“{query}”</span> · {total} {t('allResults')}
        </p>
      )}

      {!loading && flat.length === 0 ? (
        <div className="mt-10">
          <EmptyState icon={SearchIcon} title={t('noResults')} />
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {groups.map((group) => (
            <section key={group.key} aria-labelledby={`group-${group.key}`}>
              <h2 id={`group-${group.key}`} className="mb-3 font-display text-xl font-semibold text-ink-900">
                {groupLabel(group.key)}
              </h2>
              <ul className="overflow-hidden rounded-2xl border border-ink-900/[0.06] bg-white shadow-card">
                {group.items.map((item) => (
                  <li key={`${group.key}-${item.id}`} className="border-b border-ink-900/[0.05] last:border-b-0">
                    <Link
                      href={item.href}
                      className="flex min-h-[64px] items-center gap-3 px-4 py-3 transition-colors hover:bg-sand-50"
                    >
                      {item.image ? (
                        <Image src={item.image} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-xl object-cover" />
                      ) : (
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-peach-100 text-sunset-600" aria-hidden>
                          <SearchIcon size={17} />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="min-w-0 truncate text-[15px] font-semibold text-ink-900">{item.title}</span>
                          {item.badge && (
                            <span className="shrink-0 rounded-full bg-sunset-500 px-2 py-0.5 text-[10.5px] font-bold text-white">
                              {item.badge}
                            </span>
                          )}
                        </span>
                        {item.subtitle && (
                          <span className="mt-0.5 block truncate text-[13px] text-ink-500">{item.subtitle}</span>
                        )}
                      </span>
                      <ChevronRight size={16} className="flip-rtl shrink-0 text-ink-300" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
