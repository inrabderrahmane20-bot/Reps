'use client';

import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';

export const PROMO_SORTS = [
  'discount',
  'price-asc',
  'price-desc',
  'ending',
  'newest',
  'relevance',
] as const;

export type PromoSort = (typeof PROMO_SORTS)[number];

/** Sort dropdown for the promotions page (native select = accessible by default). */
export function PromoSortSelect({
  value,
  onChange,
  hasQuery,
}: {
  value: PromoSort;
  onChange: (next: PromoSort) => void;
  /** "Relevance" only makes sense while a search query is present. */
  hasQuery?: boolean;
}) {
  const t = useTranslations('promotions');

  const options: { value: PromoSort; label: string }[] = [
    { value: 'discount', label: t('sortDiscount') },
    { value: 'price-asc', label: t('sortPriceAsc') },
    { value: 'price-desc', label: t('sortPriceDesc') },
    { value: 'ending', label: t('sortEndingSoon') },
    { value: 'newest', label: t('sortNewest') },
  ];
  if (hasQuery) options.unshift({ value: 'relevance', label: t('sortRelevance') });

  return (
    <div className="relative inline-flex min-w-0 items-center">
      <label htmlFor="promo-sort" className="sr-only">
        {t('sortBy')}
      </label>
      <select
        id="promo-sort"
        value={value}
        onChange={(e) => onChange(e.target.value as PromoSort)}
        className="h-11 min-w-0 max-w-full appearance-none rounded-full border border-ink-900/10 bg-white py-2 pe-9 ps-4 text-[13px] font-semibold text-ink-800 outline-none transition-colors hover:bg-sand-100 focus:border-sunset-400 focus:ring-2 focus:ring-sunset-200"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={15}
        aria-hidden
        className="pointer-events-none absolute end-3 text-ink-400"
      />
    </div>
  );
}
