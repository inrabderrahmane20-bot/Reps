'use client';

import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { PromoFiltersState } from './promo-filters';
import { PromoCategoryLabel } from './promo-filters';

interface Chip {
  key: string;
  label: ReactNode;
  clear: () => void;
}

/**
 * The list of filters currently applied, each individually removable.
 * Rendered only when at least one filter is active.
 */
export function PromoActiveFilters({
  value,
  onChange,
  onReset,
}: {
  value: PromoFiltersState;
  onChange: (next: PromoFiltersState) => void;
  onReset: () => void;
}) {
  const t = useTranslations('promotions');

  const chips: Chip[] = [];

  if (value.cat !== null) {
    chips.push({
      key: 'cat',
      label: <PromoCategoryLabel name={value.cat} />,
      clear: () => onChange({ ...value, cat: null }),
    });
  }
  if (value.minDiscount !== null || value.maxDiscount !== null) {
    const label =
      value.minDiscount !== null && value.maxDiscount !== null
        ? t('discountBetween', { min: value.minDiscount, max: value.maxDiscount })
        : value.minDiscount !== null
          ? t('discountAndMore', { value: value.minDiscount })
          : t('discountUpTo', { value: value.maxDiscount });
    chips.push({
      key: 'discount',
      label,
      clear: () => onChange({ ...value, minDiscount: null, maxDiscount: null }),
    });
  }
  if (value.minPrice !== null || value.maxPrice !== null) {
    const label =
      value.minPrice !== null && value.maxPrice !== null
        ? t('priceBetween', { min: value.minPrice, max: value.maxPrice })
        : value.minPrice !== null
          ? t('priceFrom', { value: value.minPrice })
          : t('priceUpTo', { value: value.maxPrice });
    chips.push({
      key: 'price',
      label,
      clear: () => onChange({ ...value, minPrice: null, maxPrice: null }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-bold uppercase tracking-wider text-ink-300">
        {t('activeFilters')}
      </span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.clear}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-sunset-500/10 py-1 pe-2 ps-3 text-[12.5px] font-semibold text-sunset-800 transition-colors hover:bg-sunset-500/20"
        >
          <span className="min-w-0 max-w-[14rem] truncate">{chip.label}</span>
          <span
            aria-hidden
            className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sunset-500/15 text-sunset-800"
          >
            <X size={12} />
          </span>
          <span className="sr-only">{t('removeFilter')}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={onReset}
        className="min-h-8 rounded-full px-2.5 text-[12.5px] font-semibold text-ink-500 underline underline-offset-4 transition-colors hover:text-ink-900"
      >
        {t('clearAll')}
      </button>
    </div>
  );
}
