'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import {
  PromoFiltersPanel,
  type PromoCategoryFacet,
  type PromoFiltersState,
  type PromoPriceRange,
} from './promo-filters';

/**
 * Mobile-only bottom-sheet filter drawer for the promotions page.
 * Shares the desktop filter panel; edits are applied when the user confirms.
 */
export function PromoFilterDrawer({
  value,
  onChange,
  onReset,
  onClose,
  facets,
  priceRange,
}: {
  value: PromoFiltersState;
  onChange: (next: PromoFiltersState) => void;
  onReset: () => void;
  onClose: () => void;
  facets: PromoCategoryFacet[];
  priceRange: PromoPriceRange;
}) {
  const t = useTranslations('promotions');
  const common = useTranslations('common');
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape closes the sheet; the body scroll is locked while it is open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] bg-ink-900/40 lg:hidden" onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('filters')}
        className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-[1.75rem] bg-sand-50 shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ink-900/[0.07] px-5 py-4">
          <h3 className="font-display text-lg font-semibold text-ink-900">{t('filters')}</h3>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={common('close')}
            className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink-500 shadow-card transition-colors hover:text-ink-900"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <PromoFiltersPanel
            value={value}
            onChange={onChange}
            onReset={onReset}
            facets={facets}
            priceRange={priceRange}
            showApply
            onApply={onClose}
          />
        </div>
      </div>
    </div>
  );
}
