'use client';

import { useTranslations } from 'next-intl';
import { RotateCcw } from 'lucide-react';
import { categoryMessageKey } from '@/lib/category-labels';

/** State of the promotion filters (all optional). */
export interface PromoFiltersState {
  /** Top-level family (or raw category) the offer belongs to. */
  cat: string | null;
  /** Minimum discount in percent; null = any. */
  minDiscount: number | null;
  /** Maximum discount in percent; null = any. */
  maxDiscount: number | null;
  /** Minimum promotional price in MAD; null = any. */
  minPrice: number | null;
  /** Maximum promotional price in MAD; null = any. */
  maxPrice: number | null;
}

export const DEFAULT_PROMO_FILTERS: PromoFiltersState = {
  cat: null,
  minDiscount: null,
  maxDiscount: null,
  minPrice: null,
  maxPrice: null,
};

/** A category that actually carries at least one active offer. */
export interface PromoCategoryFacet {
  name: string;
  count: number;
}

/** Price bounds of the current result set (MAD). */
export interface PromoPriceRange {
  min: number | null;
  max: number | null;
}

const DISCOUNT_STEPS = [10, 20, 30, 50];

/**
 * Localised label for a category facet. Taxonomy families have a translation
 * in the `categories` namespace; legacy raw categories fall back to their
 * stored name (honest: we never rename a category the database does not know).
 */
export function PromoCategoryLabel({ name }: { name: string }) {
  const t = useTranslations('categories');
  const key = categoryMessageKey(name);
  if (!key) return <>{name}</>;
  try {
    const translated = t(key as never) as unknown as string;
    return <>{translated || name}</>;
  } catch {
    return <>{name}</>;
  }
}

export function PromoFiltersPanel({
  value,
  onChange,
  onReset,
  facets,
  priceRange,
  showApply,
  onApply,
}: {
  value: PromoFiltersState;
  onChange: (next: PromoFiltersState) => void;
  onReset: () => void;
  facets: PromoCategoryFacet[];
  priceRange: PromoPriceRange;
  /** Mobile drawer: show the Reset + Apply footer. Desktop applies live. */
  showApply?: boolean;
  onApply?: () => void;
}) {
  const t = useTranslations('promotions');

  const hasActive =
    value.cat !== null ||
    value.minDiscount !== null ||
    value.maxDiscount !== null ||
    value.minPrice !== null ||
    value.maxPrice !== null;

  return (
    <div className="flex flex-col gap-6">
      {/* CATEGORY — only families that really have an offer */}
      <section aria-label={t('category')}>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-300">{t('category')}</h3>
        {facets.length === 0 ? (
          <p className="mt-2 text-[13px] leading-relaxed text-ink-400">{t('noCategoriesYet')}</p>
        ) : (
          <div className="mt-2.5 space-y-0.5" role="list">
            <CategoryRow
              label={t('allCategories')}
              selected={value.cat === null}
              onSelect={() => onChange({ ...value, cat: null })}
            />
            {facets.map((facet) => (
              <CategoryRow
                key={facet.name}
                label={<PromoCategoryLabel name={facet.name} />}
                count={facet.count}
                selected={value.cat === facet.name}
                onSelect={() =>
                  onChange({ ...value, cat: value.cat === facet.name ? null : facet.name })
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* DISCOUNT SIZE */}
      <section aria-label={t('discount')}>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-300">{t('discount')}</h3>
        <div className="mt-2.5 space-y-0.5" role="list">
          <CategoryRow
            label={t('anyDiscount')}
            selected={value.minDiscount === null && value.maxDiscount === null}
            onSelect={() => onChange({ ...value, minDiscount: null, maxDiscount: null })}
          />
          {DISCOUNT_STEPS.map((step) => (
            <CategoryRow
              key={step}
              label={t('discountAndMore', { value: step })}
              selected={value.minDiscount === step && value.maxDiscount === null}
              onSelect={() =>
                onChange({
                  ...value,
                  minDiscount: value.minDiscount === step && value.maxDiscount === null ? null : step,
                  maxDiscount: null,
                })
              }
            />
          ))}
        </div>
      </section>

      {/* PRICE RANGE */}
      <section aria-label={t('priceRange')}>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-300">{t('priceRange')}</h3>
        <div className="mt-2.5 space-y-2">
          <div className="flex items-center gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">{t('minPrice')}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={value.minPrice ?? ''}
                placeholder={priceRange.min != null ? String(priceRange.min) : t('minPrice')}
                onChange={(e) => {
                  const raw = e.target.value;
                  const n = raw === '' ? null : Number(raw);
                  onChange({ ...value, minPrice: n !== null && Number.isFinite(n) && n >= 0 ? n : null });
                }}
                className="h-11 w-full min-w-0 rounded-xl border border-ink-900/10 bg-white px-3 text-sm text-ink-900 outline-none transition-colors focus:border-sunset-400 focus:ring-2 focus:ring-sunset-200"
              />
            </label>
            <span className="shrink-0 text-ink-400" aria-hidden>
              –
            </span>
            <label className="min-w-0 flex-1">
              <span className="sr-only">{t('maxPrice')}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={value.maxPrice ?? ''}
                placeholder={priceRange.max != null ? String(priceRange.max) : t('maxPrice')}
                onChange={(e) => {
                  const raw = e.target.value;
                  const n = raw === '' ? null : Number(raw);
                  onChange({ ...value, maxPrice: n !== null && Number.isFinite(n) && n >= 0 ? n : null });
                }}
                className="h-11 w-full min-w-0 rounded-xl border border-ink-900/10 bg-white px-3 text-sm text-ink-900 outline-none transition-colors focus:border-sunset-400 focus:ring-2 focus:ring-sunset-200"
              />
            </label>
          </div>
          <p className="text-[11.5px] leading-relaxed text-ink-400">{t('priceRangeHint')}</p>
        </div>
      </section>

      {(showApply || hasActive) && (
        <div className={`flex items-center gap-2 ${showApply ? 'border-t border-ink-900/[0.08] pt-4' : ''}`}>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-ink-900/10 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition-colors hover:bg-sand-100"
          >
            <RotateCcw size={14} aria-hidden />
            {t('resetFilters')}
          </button>
          {showApply && (
            <button
              type="button"
              onClick={onApply}
              className="min-h-11 flex-1 rounded-full bg-sunset-500 px-4 py-2 text-sm font-semibold text-white shadow-sunset transition-colors hover:bg-sunset-600"
            >
              {t('applyFilters')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CategoryRow({
  label,
  count,
  selected,
  onSelect,
}: {
  label: React.ReactNode;
  count?: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`flex min-h-9 w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-start text-[13px] transition-colors ${
        selected ? 'bg-sunset-500/10 font-semibold text-sunset-800' : 'text-ink-700 hover:bg-sand-100'
      }`}
    >
      <span
        className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border ${
          selected ? 'border-sunset-500 bg-sunset-500' : 'border-ink-300'
        }`}
        aria-hidden
      >
        {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {typeof count === 'number' && (
        <span className="shrink-0 text-[11px] font-semibold text-ink-400 tabular-nums">{count}</span>
      )}
    </button>
  );
}
