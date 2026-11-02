'use client';

import { useTranslations } from 'next-intl';
import { ChevronRight, RotateCcw, Star } from 'lucide-react';
import { ZONES } from '@/lib/zones';
import type { Availability } from '@/lib/types';

export interface FiltersState {
  /** Selected category node name (top-level, subcategory or leaf), or null for all. */
  cat: string | null;
  /** Included availability states; empty array means "any". */
  availability: Availability[];
  /** Minimum average rating; null means "any". */
  minRating: number | null;
  /** Zone id, or "all". */
  zone: string;
}

export const DEFAULT_FILTERS: FiltersState = { cat: null, availability: [], minRating: null, zone: 'all' };

const RATING_OPTIONS = [4.5, 4, 3];

export function FiltersPanel({
  value,
  onChange,
  onReset,
  onOpenCategories,
  showApply,
  onApply,
}: {
  value: FiltersState;
  onChange: (next: FiltersState) => void;
  onReset: () => void;
  onOpenCategories: () => void;
  /** Show a footer with Reset + Apply (mobile drawer). Desktop applies live. */
  showApply?: boolean;
  onApply?: () => void;
}) {
  const t = useTranslations('services');
  const common = useTranslations('common');

  function toggleAvailability(state: Availability) {
    const has = value.availability.includes(state);
    onChange({
      ...value,
      availability: has
        ? value.availability.filter((a) => a !== state)
        : [...value.availability, state],
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section aria-label={t('category')}>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-300">{t('category')}</h3>
        <button
          type="button"
          onClick={onOpenCategories}
          className="mt-2 flex min-h-[62px] w-full items-center gap-3 rounded-xl border border-ink-900/[0.08] bg-white px-3.5 py-3 text-start shadow-card transition-colors hover:border-majorelle-200 hover:bg-sand-50"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink-900">
              {value.cat ?? t('allCategories')}
            </span>
            <span className="mt-0.5 block text-xs text-ink-500">
              {value.cat ? t('categorySelection', { category: value.cat }) : t('noCategorySelected')}
            </span>
          </span>
          <ChevronRight size={17} className="flip-rtl shrink-0 text-ink-400" aria-hidden />
        </button>
      </section>

      {/* ZONE */}
      <section aria-label={t('zone')}>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-300">{t('zone')}</h3>
        <div className="mt-2.5 space-y-0.5">
          <CategoryRow
            label={t('allZones')}
            selected={value.zone === 'all'}
            onSelect={() => onChange({ ...value, zone: 'all' })}
          />
          {ZONES.map((zone) => (
            <CategoryRow
              key={zone.id}
              label={zone.name}
              selected={value.zone === zone.id}
              onSelect={() => onChange({ ...value, zone: zone.id })}
            />
          ))}
        </div>
      </section>

      {/* AVAILABILITY */}
      <section aria-label={t('availability')}>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-300">{t('availability')}</h3>
        <div className="mt-2.5 space-y-1">
          {(
            [
              { state: 'available' as Availability, label: common('available'), dot: 'bg-zellige-500' },
              { state: 'later' as Availability, label: common('availableLater'), dot: 'bg-saffron-500' },
            ] as const
          ).map(({ state, label, dot }) => {
            const checked = value.availability.includes(state);
            return (
              <label
                key={state}
                className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                  checked ? 'bg-majorelle-600/5 text-ink-900' : 'text-ink-700 hover:bg-sand-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleAvailability(state)}
                  className="h-4 w-4 shrink-0 accent-majorelle-600 rounded"
                />
                <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      </section>

      {/* RATING */}
      <section aria-label={t('rating')}>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-300">{t('rating')}</h3>
        <div className="mt-2.5 space-y-1">
          {RATING_OPTIONS.map((rating) => {
            const checked = value.minRating === rating;
            const stars = Math.round(rating);
            return (
              <label
                key={rating}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                  checked ? 'bg-majorelle-600/5 text-ink-900' : 'text-ink-700 hover:bg-sand-100'
                }`}
              >
                <input
                  type="radio"
                  name="min-rating"
                  checked={checked}
                  onChange={() => onChange({ ...value, minRating: checked ? null : rating })}
                  className="h-4 w-4 shrink-0 accent-majorelle-600"
                />
                <span className="inline-flex items-center gap-0.5" aria-hidden>
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} size={13} className="fill-saffron-500 text-saffron-500" />
                  ))}
                </span>
                <span className="text-ink-500">{t('ratingAndUp', { value: rating })}</span>
              </label>
            );
          })}
        </div>
      </section>

      {(showApply ||
        value.cat !== null ||
        value.availability.length > 0 ||
        value.minRating !== null ||
        value.zone !== 'all') && (
        <div className={`flex items-center gap-2 ${showApply ? 'border-t border-ink-900/[0.08] pt-4' : ''}`}>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-ink-900/10 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition-colors hover:bg-sand-100"
          >
            <RotateCcw size={14} />
            {t('resetFilters')}
          </button>
          {showApply && (
            <button
              type="button"
              onClick={onApply}
              className="flex-1 rounded-full bg-majorelle-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-majorelle-700"
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
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-start text-[13px] transition-colors ${
        selected
          ? 'bg-majorelle-600 text-white shadow-sm'
          : 'text-ink-700 hover:bg-sand-100'
      }`}
    >
      <span
        className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border ${
          selected ? 'border-white bg-majorelle-600' : 'border-ink-300'
        }`}
        aria-hidden
      >
        {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </span>
      <span className="min-w-0 flex-1 truncate" title={label}>
        {label}
      </span>
    </button>
  );
}