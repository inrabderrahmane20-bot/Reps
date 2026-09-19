'use client';

import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { FiltersPanel, type FiltersState } from './filters-panel';
import { ClientSearchesPanel } from './client-searches-panel';

/** Mobile-only bottom-sheet filter drawer. Shares the desktop filter panel. */
export function MobileFilterDrawer({
  value,
  onChange,
  onReset,
  onClose,
  clientSearchesKey = 0,
}: {
  value: FiltersState;
  onChange: (next: FiltersState) => void;
  onReset: () => void;
  onClose: () => void;
  /** Bump to refresh the "Recherche client" list shown inside the drawer. */
  clientSearchesKey?: number;
}) {
  const t = useTranslations('services');
  const common = useTranslations('common');

  return (
    <div className="fixed inset-0 z-50 bg-ink-900/40 lg:hidden" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('filters')}
        className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-[1.75rem] bg-sand-50 shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ink-900/[0.07] px-5 py-4">
          <h3 className="font-display text-lg font-semibold text-ink-900">{t('filters')}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={common('close')}
            className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink-500 shadow-card transition-colors hover:text-ink-900"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <FiltersPanel
            value={value}
            onChange={onChange}
            onReset={onReset}
            showApply
            onApply={onClose}
          />
          <ClientSearchesPanel refreshKey={clientSearchesKey} />
        </div>
      </div>
    </div>
  );
}