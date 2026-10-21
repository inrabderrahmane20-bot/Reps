'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales, localeLabel, type Locale } from '@/i18n/config';

export type LanguageSwitcherVariant = 'full' | 'short' | 'icon';

/**
 * Language picker — a single, self-sized dropdown.
 *
 * The control is an inline-flex button so it always fits its own content
 * (icon + label + chevron) with no leftover empty space, and it keeps the same
 * 40px height as the neighbouring navbar actions. The wrapper is `inline-flex`
 * as well, so the trigger never stretches to fill its parent — the menu is
 * therefore anchored exactly under the button, not under a full-width box.
 *
 * The menu is anchored to the inline end of the trigger, which keeps it inside
 * the viewport in both LTR and RTL (the navbar utility group always sits at the
 * inline end of the bar, so the menu always opens towards the content).
 *
 * Variants
 *   full  — globe + language name + chevron (desktop)
 *   short — globe + 2-letter code, content sized (compact bars)
 *   icon  — globe only (tightest layouts)
 */
export function LanguageSwitcher({
  variant = 'full',
  className = '',
  wrapperClassName = '',
}: {
  variant?: LanguageSwitcherVariant;
  /** Extra classes for the trigger button (e.g. a taller touch target). */
  className?: string;
  /** Extra classes for the positioning wrapper. */
  wrapperClassName?: string;
}) {
  const t = useTranslations('nav');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function choose(l: Locale) {
    setOpen(false);
    if (l !== locale) router.replace(pathname, { locale: l });
  }

  const showLabel = variant === 'full';
  const showCode = variant === 'short';
  const showChevron = variant === 'full';

  return (
    <div className={`relative inline-flex shrink-0 ${wrapperClassName}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('language')}
        title={localeLabel[locale]}
        className={`inline-flex h-10 items-center rounded-full border border-ink-900/10 bg-white font-semibold text-ink-700 transition-colors hover:border-sunset-200 hover:bg-peach-50 hover:text-sunset-700 ${
          showLabel
            ? 'gap-2 px-3 text-[13px]'
            : showCode
              ? 'gap-1.5 px-2.5 text-[12.5px]'
              : 'w-10 justify-center'
        } ${className}`}
      >
        <Globe size={16} className="shrink-0 text-sunset-600" aria-hidden />
        {showLabel && <span className="whitespace-nowrap">{localeLabel[locale]}</span>}
        {showCode && (
          <span className="whitespace-nowrap uppercase tracking-wide" aria-hidden>
            {locale}
          </span>
        )}
        {showChevron && (
          <ChevronDown
            size={14}
            className={`shrink-0 text-ink-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t('language')}
          className="absolute end-0 top-12 z-50 w-max min-w-[11rem] max-w-[min(16rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-ink-900/[0.07] bg-white/95 p-1.5 shadow-float backdrop-blur"
        >
          <p className="px-3 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-300">
            {t('language')}
          </p>
          {locales.map((l) => {
            const active = l === locale;
            return (
              <button
                key={l}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => choose(l)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] font-medium transition-colors ${
                  active ? 'bg-peach-100 text-sunset-700' : 'text-ink-700 hover:bg-sand-100'
                }`}
              >
                <Check size={14} className={active ? 'text-sunset-600' : 'text-transparent'} aria-hidden />
                <span className="flex-1 whitespace-nowrap text-start">{localeLabel[l]}</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-300">{l}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
