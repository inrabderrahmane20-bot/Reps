'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { FiltersPanel, type FiltersState } from './filters-panel';
import { ClientSearchesPanel } from './client-searches-panel';

/** Mobile-only bottom-sheet filter drawer. Shares the desktop filter panel. */
export function MobileFilterDrawer({
  value,
  onChange,
  onReset,
  onOpenCategories,
  onClose,
  clientSearchesKey = 0,
}: {
  value: FiltersState;
  onChange: (next: FiltersState) => void;
  onReset: () => void;
  onOpenCategories: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onClose: () => void;
  /** Bump to refresh the "Recherche client" list shown inside the drawer. */
  clientSearchesKey?: number;
}) {
  const t = useTranslations('services');
  const common = useTranslations('common');

  // Escape closes the sheet; lock body scroll while it is open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] bg-forest-950/45 lg:hidden" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('filters')}
        className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-[1.75rem] border-t border-gold-muted/50 bg-ivory-main shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="h-1 w-8 rounded-full bg-gold-muted/60" aria-hidden />
            <h3 className="font-display text-lg font-semibold text-typography-main">{t('filters')}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={common('close')}
            className="grid h-9 w-9 place-items-center rounded-full border border-gold-muted/40 bg-card-soft text-typography-main/60 shadow-card transition-colors hover:text-typography-main"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <FiltersPanel
            value={value}
            onChange={onChange}
            onReset={onReset}
            onOpenCategories={onOpenCategories}
            showApply
            onApply={onClose}
          />
          <ClientSearchesPanel refreshKey={clientSearchesKey} />
        </div>
      </div>
    </div>
  );
}
