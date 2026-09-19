'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, RotateCcw, Star } from 'lucide-react';
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

  // Two-pane category drilldown: the left list keeps the top-level groups (the
  // "original" navigation); the right pane shows the next level — subcategories
  // or leaf services — of the selected group instead of expanding inline.
  const [drillTop, setDrillTop] = useState<string | null>(null);
  const [drillSub, setDrillSub] = useState<string | null>(null);

  // Keep the drilldown synchronised when the selection comes from outside
  // (search suggestions, mobile chips, page load, …).
  useEffect(() => {
    const cat = value.cat;
    if (!cat) {
      setDrillTop(null);
      setDrillSub(null);
      return;
    }
    const parent = findParentTop(cat);
    if (!parent) {
      setDrillTop(null);
      setDrillSub(null);
      return;
    }
    const subs = subcategoriesOf(parent);
    let sub: TaxNode | null = null;
    for (const child of subs) {
      if (normalizeCategory(child.name) === normalizeCategory(cat)) {
        sub = child;
        break;
      }
      if ((child.children ?? []).some((c) => normalizeCategory(c.name) === normalizeCategory(cat))) {
        sub = child;
        break;
      }
    }
    setDrillTop(parent);
    setDrillSub(sub?.name ?? null);
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

  function selectTop(top: string) {
    onChange({ ...value, cat: top });
    setDrillTop(top);
    setDrillSub(null);
  }

  function selectAll() {
    onChange({ ...value, cat: null });
    setDrillTop(null);
    setDrillSub(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* CATEGORY — two-pane drilldown */}
      <section aria-label={t('category')}>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-300">{t('category')}</h3>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {/* Original list: all top-level groups */}
          <div className="flex min-w-0 flex-col gap-0.5">
            <CategoryRow label={t('allCategories')} selected={!activeCat} onSelect={selectAll} />
            <div className="max-h-[300px] space-y-0.5 overflow-y-auto pe-1" role="list">
              {topNames.map((top) => (
                <CategoryRow
                  key={top}
                  label={top}
                  selected={activeCat !== null && normalizeCategory(activeCat) === normalizeCategory(top)}
                  onSelect={() => selectTop(top)}
                />
              ))}
            </div>
          </div>

          {/* The rest: contextual subcategory / leaf pane */}
          <div className="flex min-h-[220px] min-w-0 flex-col rounded-xl border border-ink-900/[0.08] bg-sand-100/60 p-1.5">
            {!drillTop ? (
              <p className="mx-auto my-auto max-w-[9rem] text-center text-[11.5px] leading-snug text-ink-300">
                {t('selectCategoryHint')}
              </p>
            ) : !drillSub ? (
              <>
                <DrillHeader label={drillTop} onBack={() => setDrillTop(null)} backLabel={t('allCategories')} />
                <div className="mt-1 max-h-[236px] space-y-0.5 overflow-y-auto" role="list">
                  {subcategoriesOf(drillTop).map((sub) => {
                    const hasChildren = (sub.children ?? []).length > 0;
                    const selected = normalizeCategory(activeCat ?? '') === normalizeCategory(sub.name);
                    return (
                      <DrillRow
                        key={sub.name}
                        label={sub.name}
                        selected={selected}
                        hasNext={hasChildren}
                        onSelect={() => {
                          onChange({ ...value, cat: sub.name });
                          if (hasChildren) setDrillSub(sub.name);
                          else setDrillSub(null);
                        }}
                      />
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <DrillHeader label={drillSub} onBack={() => setDrillSub(null)} backLabel={drillTop} />
                <div className="mt-1 max-h-[236px] space-y-0.5 overflow-y-auto" role="list">
                  {findNodeChildren(drillTop, drillSub).map((leaf) => (
                    <DrillRow
                      key={leaf.name}
                      label={leaf.name}
                      selected={normalizeCategory(activeCat ?? '') === normalizeCategory(leaf.name)}
                      onSelect={() => onChange({ ...value, cat: leaf.name })}
                    />
                  ))}
                </div>
              </>
            )}
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

/** Children of a given subcategory within a top-level group. */
function findNodeChildren(top: string, sub: string): TaxNode[] {
  const subs = subcategoriesOf(top);
  const node = subs.find((s) => normalizeCategory(s.name) === normalizeCategory(sub));
  return node?.children ?? [];
}

/** Small header for the drill-down pane with an up/back control. */
function DrillHeader({ label, backLabel, onBack }: { label: string; backLabel: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-1 border-b border-ink-900/[0.08] pb-1.5">
      <button
        type="button"
        onClick={onBack}
        aria-label={backLabel}
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-ink-500 transition-colors hover:bg-white hover:text-ink-900"
      >
        <ChevronLeft size={15} />
      </button>
      <span className="min-w-0 flex-1 truncate text-[12px] font-bold text-ink-900" title={label}>
        {label}
      </span>
    </div>
  );
}

function DrillRow({
  label,
  selected,
  hasNext,
  onSelect,
}: {
  label: string;
  selected: boolean;
  hasNext?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-start text-[12px] transition-colors ${
        selected ? 'bg-majorelle-600 font-semibold text-white shadow-sm' : 'text-ink-700 hover:bg-white'
      }`}
    >
      <span className="min-w-0 flex-1 truncate" title={label}>
        {label}
      </span>
      {hasNext && <ChevronRight size={13} className="shrink-0 opacity-50" />}
    </button>
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