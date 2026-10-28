'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, RotateCcw, Star } from 'lucide-react';
import {
  TAXONOMY,
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

  const [categoryPath, setCategoryPath] = useState<TaxNode[]>([]);

  // Keep the visible level in sync with selections made elsewhere.
  useEffect(() => {
    setCategoryPath(value.cat ? getBrowsePath(value.cat) : []);
  }, [value.cat]);

  const activeCat = value.cat ?? null;
  const categoryLevel = categoryPath.length > 0
    ? categoryPath[categoryPath.length - 1].children ?? []
    : TAXONOMY;

  function toggleAvailability(state: Availability) {
    const has = value.availability.includes(state);
    onChange({
      ...value,
      availability: has
        ? value.availability.filter((a) => a !== state)
        : [...value.availability, state],
    });
  }

  function selectAll() {
    onChange({ ...value, cat: null });
    setCategoryPath([]);
  }

  function selectCategory(node: TaxNode) {
    onChange({ ...value, cat: node.name });
    if (node.children?.length) {
      setCategoryPath((path) => [...path, node]);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section aria-label={t('category')}>
        <div className="overflow-hidden rounded-xl border border-ink-900/[0.1] bg-white">
          <nav
            aria-label={t('category')}
            className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-ink-900/[0.08] px-3.5 py-3 text-xs leading-relaxed"
          >
            <button
              type="button"
              onClick={() => setCategoryPath([])}
              className={categoryPath.length === 0 ? 'font-semibold text-ink-900' : 'text-ink-500 hover:text-ink-900'}
            >
              {t('categories')}
            </button>
            {categoryPath.map((node, index) => (
              <span key={`${node.name}-${index}`} className="flex items-center gap-2">
                <span className="text-ink-300" aria-hidden>/</span>
                <button
                  type="button"
                  onClick={() => setCategoryPath(categoryPath.slice(0, index + 1))}
                  className={index === categoryPath.length - 1 ? 'font-bold text-ink-900' : 'text-ink-500 hover:text-ink-900'}
                >
                  {node.name}
                </button>
              </span>
            ))}
          </nav>

          <div className="max-h-[300px] space-y-1 overflow-y-auto p-2" role="list">
            {categoryPath.length > 0 && (
              <button
                type="button"
                onClick={() => setCategoryPath(categoryPath.slice(0, -1))}
                className="flex min-h-[46px] w-full items-center gap-3 rounded-lg px-3 text-start text-[13px] text-ink-700 transition-colors hover:border-ink-900/[0.08] hover:bg-sand-100"
              >
                <ChevronLeft size={17} className="shrink-0 text-ink-500" />
                <span>{t('backToPreviousLevel')}</span>
              </button>
            )}
            {categoryPath.length === 0 && (
              <CategoryOption label={t('allCategories')} selected={!activeCat} onSelect={selectAll} />
            )}
            {categoryLevel.map((node) => (
              <CategoryOption
                key={node.name}
                label={node.name}
                selected={activeCat !== null && normalizeCategory(activeCat) === normalizeCategory(node.name)}
                hasChildren={Boolean(node.children?.length)}
                onSelect={() => selectCategory(node)}
              />
            ))}
          </div>

          <div className="border-t border-ink-900/[0.08] px-3.5 py-3 text-[11px] text-ink-500">
            {activeCat ? t('categorySelection', { category: activeCat }) : t('noCategorySelected')}
          </div>
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

function CategoryOption({
  label,
  selected,
  hasChildren,
  onSelect,
}: {
  label: string;
  selected: boolean;
  hasChildren?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex min-h-[46px] w-full items-center gap-3 rounded-lg border px-3 text-start text-[13px] transition-colors ${
        selected
          ? 'border-[#e5d8c8] bg-[#f4eee5] font-semibold text-ink-900'
          : 'border-transparent text-ink-700 hover:border-ink-900/[0.08] hover:bg-sand-100'
      }`}
    >
      <span
        className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
          selected ? 'border-[5px] border-[#9a7653]' : 'border-[#b8a793]'
        }`}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate" title={label}>
        {label}
      </span>
      {hasChildren && <ChevronRight size={16} className="shrink-0 text-ink-400" />}
    </button>
  );
}

function getBrowsePath(name: string): TaxNode[] {
  const target = normalizeCategory(name);
  const findPath = (nodes: TaxNode[], path: TaxNode[]): TaxNode[] | null => {
    for (const node of nodes) {
      const currentPath = [...path, node];
      if (normalizeCategory(node.name) === target) {
        return node.children?.length ? currentPath : currentPath.slice(0, -1);
      }
      if (node.children) {
        const found = findPath(node.children, currentPath);
        if (found) return found;
      }
    }
    return null;
  };
  return findPath(TAXONOMY, []) ?? [];
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