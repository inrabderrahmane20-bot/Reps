'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import { X, Globe } from 'lucide-react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales, localeLabel, type Locale } from '@/i18n/config';
import { hasLanguagePreference, saveLanguagePreference } from '@/lib/language-preference';
import { useAuth } from '@/context/auth-context';

/** Flag per supported locale — generated from the same list as the site. */
const FLAGS: Record<Locale, string> = { en: '🇬🇧', fr: '🇫🇷', ar: '🇲🇦' };

/** Known language names per locale (matched against user.languages). */
const LANG_ALIASES: Record<Locale, string[]> = {
  en: ['english'],
  fr: ['french', 'francaise', 'français', 'francais'],
  ar: ['arabic', 'arabe', 'العربية'],
};

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function accountLocale(userLanguages: string[] | undefined): Locale | undefined {
  if (!userLanguages?.length) return undefined;
  const spoken = userLanguages.map(normalize);
  return locales.find((l) => LANG_ALIASES[l].some((alias) => spoken.includes(normalize(alias))));
}

/**
 * First-visit language selection modal.
 *
 * Shows only once (per browser), only when the user has never picked a
 * language on this device. Choosing a language saves the preference and
 * reloads the site in that language. The permanent language switcher in the
 * header is a separate mechanism and never triggers this modal.
 *
 * Server-rendered as closed and only opens after hydration, so there is no
 * hydration mismatch and no flash of a modal for returning visitors.
 */
export function FirstVisitLanguageModal() {
  const t = useTranslations('gate');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Locale | null>(null);
  // Guards against re-opening when the effect re-runs (e.g. when the auth
  // context resolves and `user` changes) after the visitor has dismissed it.
  const decidedRef = useRef(false);

  useEffect(() => {
    if (decidedRef.current) return;
    if (hasLanguagePreference()) {
      decidedRef.current = true;
      return;
    }
    // Preselect a language the account already speaks, if any.
    setSelected((prev) => prev ?? accountLocale(user?.languages) ?? (locale as Locale));
    setOpen(true);
  }, [user, locale]);

  // Dismissal is final for this browsing session: the modal is shown once, and
  // it must not come back on a refresh, a client-side navigation or when the
  // account context resolves. Closing without choosing does NOT store a
  // language (the visitor may simply want to browse first) — it only stops the
  // modal from re-appearing now.
  const dismiss = useCallback(() => {
    decidedRef.current = true;
    setOpen(false);
    window.dispatchEvent(new Event('annabid:language-selection-dismissed'));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss();
    }
    if (open) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, dismiss]);

  if (!open) return null;

  const choose = (l: Locale) => {
    decidedRef.current = true;
    saveLanguagePreference(l);
    setOpen(false);
    window.dispatchEvent(new Event('annabid:language-selection-dismissed'));
    router.replace(pathname, { locale: l });
  };

  const dialog = (
    // The outer layer scrolls; the inner layer centers with min-h-full so a
    // dialog taller than the viewport can scroll without its top being cut off.
    <div
      className="first-visit-language-overlay fixed inset-0 z-[80] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={t('title')}
      onClick={dismiss}
    >
      <div className="flex min-h-full items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
        <div
          className="first-visit-language-card w-full max-w-md rounded-[24px] p-5 sm:p-7"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <span className="first-visit-language-icon grid h-12 w-12 place-items-center rounded-full">
              <Globe size={23} aria-hidden />
            </span>
            <button
              type="button"
              onClick={dismiss}
              aria-label={t('skip')}
              className="first-visit-language-close grid h-11 w-11 place-items-center rounded-full transition-colors"
            >
              <X size={17} aria-hidden />
            </button>
          </div>

          <h2 className="first-visit-language-title mt-4 break-words font-display text-2xl font-semibold">{t('title')}</h2>
          <p className="first-visit-language-copy mt-1.5 break-words text-sm leading-relaxed">{t('intro')}</p>

          <div role="radiogroup" aria-label={t('title')} className="mt-5 space-y-2">
            {locales.map((l) => {
              const isSelected = selected === l;
              return (
                <button
                  key={l}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelected(l)}
                  className={`first-visit-language-option flex min-h-11 w-full items-center gap-3 rounded-2xl border px-4 py-2.5 text-start transition-all ${
                    isSelected ? 'is-selected' : ''
                  }`}
                >
                  <span className="text-2xl leading-none" aria-hidden>
                    {FLAGS[l]}
                  </span>
                  <span className="first-visit-language-option-label min-w-0 flex-1 break-words text-[15px] font-semibold">
                    {localeLabel[l]}
                  </span>
                  <span
                    className={`first-visit-language-radio grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                      isSelected ? 'is-selected' : ''
                    }`}
                    aria-hidden
                  >
                    {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => selected && choose(selected)}
            disabled={!selected}
            className="first-visit-language-continue mt-5 min-h-12 w-full rounded-full py-3 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('continue')}
          </button>
        </div>
      </div>
    </div>
  );

  // The modal only opens post-hydration (guarded by `open`), so the portal is
  // never evaluated during SSR — same containment fix as the mobile drawer.
  return createPortal(dialog, document.body);
}