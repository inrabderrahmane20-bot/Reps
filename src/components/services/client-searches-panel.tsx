'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { SearchX } from 'lucide-react';
import { api } from '@/lib/api-client';

interface ClientSearchEntry {
  query: string;
  createdAt: string;
}

/**
 * "Recherche client" — recent client searches that did not find an exact
 * service match. Rendered in the desktop sidebar and the mobile filter drawer.
 * The Services page bumps `refreshKey` whenever a new search is recorded so the
 * list stays in sync without refetching the whole page.
 */
export function ClientSearchesPanel({ refreshKey = 0 }: { refreshKey?: number }) {
  const t = useTranslations('services');
  const [searches, setSearches] = useState<ClientSearchEntry[]>([]);

  useEffect(() => {
    let active = true;
    api
      .get<{ searches: ClientSearchEntry[] }>('/client-searches')
      .then((r) => {
        if (active) setSearches(r.searches ?? []);
      })
      .catch(() => {
        /* the panel simply stays empty */
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  return (
    <section
      aria-label={t('clientSearches')}
      className="mt-5 rounded-2xl border border-gold-muted/40 bg-beige-secondary/70 p-3.5"
    >
      <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-typography-main/45">
        <SearchX size={13} className="text-terracotta-500" aria-hidden />
        {t('clientSearches')}
      </h3>
      <p className="mt-1.5 text-[11.5px] leading-snug text-typography-main/55">{t('clientSearchesHint')}</p>
      {searches.length === 0 ? (
        <p className="mt-2 text-[11.5px] text-typography-main/35">{t('clientSearchesEmpty')}</p>
      ) : (
        <ul className="mt-2.5 space-y-1.5">
          {searches.map((s) => (
            <li key={s.query} className="flex items-center gap-2 text-[12.5px]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta-500" aria-hidden />
              <span
                className="min-w-0 flex-1 truncate font-medium text-typography-main/75"
                title={s.query}
              >
                «{s.query}»
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
