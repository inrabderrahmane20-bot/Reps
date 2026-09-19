'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, MapPin, RotateCcw, Star } from 'lucide-react';
import {
  TAXONOMY,
  subcategoriesOf,
  findParentTop,
  normalizeCategory,
  type TaxNode,
} from '@/lib/service-categories';
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
  showApply,
  onApply,
}: {
  value: FiltersState;
  onChange: (next: FiltersState) => void;
  onReset: () => void;
  /** Show a footer with Reset + Apply (mobile drawer). Desktop applies live. */
  showApply?: boolean;
  onApply?: () => void;
}) {
  const t = useTranslations('services');
  const common = useTranslations('common');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Keep the branch containing the selected category expanded even when the
  // selection came from outside (search suggestions, page load, etc).
  useEffect(() => {
    if (!value.cat) return;
    const parent = findParentTop(value.cat);
    if (parent) setExpanded((prev) => new Set(prev).add(parent));
  }, [value.cat]);

  const activeCat = value.cat ?? null;

  function toggleAvailability(state: Availability) {
    const has = value.availability.includes(state);
    onChange({
      ...value,
      availability: has
        ? value.availability.filter((a) => a !== state)
        : [...value.availability, state],
    });
  }

  const topNames = useMemo(() => TAXONOMY.map((n) => n.name), []);

  return (
    <div className="flex flex-col gap-6">
      {/* CATEGORY */}
      <section aria-label={t('category')}>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-300">{t('category')}</h3>
        <div className="mt-2.5 space-y-0.5">
          <CategoryRow
            label={t('allCategories')}
            selected={!activeCat}
            onSelect={() => onChange({ ...value, cat: null })}
          />
          {topNames.map((top) => {
            const subs = subcategoriesOf(top);
            const isTopSelected = activeCat !== null && normalizeCategory(activeCat) === normalizeCategory(top);
            const hasSelectedChild =
              activeCat !== null && findParentTop(activeCat) === top && !isTopSelected;
            const open = expanded.has(top);
            return (
              <div key={top}>
                <div className="group flex items-center gap-1">
                  <CategoryRow
                    label={top}
                    selected={isTopSelected}
                    onSelect={() => onChange({ ...value, cat: top })}
                  />
                  {subs.length > 0 && (
                    <button
                      type="button"
                      aria-label={`${open ? t('collapse') : t('expand')} ${top}`}
                      aria-expanded={open}
                      onClick={() =>
                        setExpanded((prev) => {
                          const next = new Set(prev);
                          if (open) next.delete(top);
                          else next.add(top);
                          return next;
                        })
                      }
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-ink-300 transition-colors hover:bg-sand-100 hover:text-ink-700 ${
                        open || hasSelectedChild ? 'text-ink-700' : 'text-ink-300'
                      }`}
                    >
                      <ChevronDown size={14} className={`transition-transform ${open || hasSelectedChild ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>

                {(open || hasSelectedChild) && subs.length > 0 && (
                  <div className="ms-4 mt-0.5 space-y-0.5 border-s border-ink-900/[0.08] ps-2.5">
                    {subs.map((sub) => (
                      <SubCategoryRow
                        key={sub.name}
                        node={sub}
                        selected={activeCat !== null && normalizeCategory(activeCat) === normalizeCategory(sub.name)}
                        onSelect={() => onChange({ ...value, cat: sub.name })}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  );
}

function SubCategoryRow({
  node,
  selected,
  onSelect,
}: {
  node: TaxNode;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-start text-[13px] transition-colors ${
        selected ? 'font-semibold text-majorelle-700' : 'text-ink-500 hover:bg-sand-100 hover:text-ink-900'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${selected ? 'bg-majorelle-600' : 'bg-ink-300/70'}`}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate">{node.name}</span>
    </button>
  );
}