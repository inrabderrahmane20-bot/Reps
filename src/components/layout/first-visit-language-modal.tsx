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
    router.replace(pathname, { locale: l });
  };

  const dialog = (
    // The outer layer scrolls; the inner layer centers with min-h-full so a
    // dialog taller than the viewport can scroll without its top being cut off.
    <div
      className="fixed inset-0 z-[70] overflow-y-auto bg-ink-900/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t('title')}
      onClick={dismiss}
    >
      <div className="flex min-h-full items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
        <div
          className="w-full max-w-md rounded-[24px] border border-white/60 bg-sand-50 p-5 shadow-float sm:p-7"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-sunset-500 to-sunset-600 text-white shadow-sunset">
              <Globe size={23} aria-hidden />
            </span>
            <button
              type="button"
              onClick={dismiss}
              aria-label={t('skip')}
              className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink-500 shadow-card transition-colors hover:text-ink-900"
            >
              <X size={17} aria-hidden />
            </button>
          </div>

          <h2 className="mt-4 break-words font-display text-2xl font-semibold text-ink-900">{t('title')}</h2>
          <p className="mt-1.5 break-words text-sm leading-relaxed text-ink-500">{t('intro')}</p>

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
                  className={`flex min-h-11 w-full items-center gap-3 rounded-2xl border px-4 py-2.5 text-start transition-all ${
                    isSelected
                      ? 'border-sunset-500 bg-sunset-500/[0.08] shadow-card'
                      : 'border-ink-900/10 bg-white hover:border-sunset-300'
                  }`}
                >
                  <span className="text-2xl leading-none" aria-hidden>
                    {FLAGS[l]}
                  </span>
                  <span className="min-w-0 flex-1 break-words text-[15px] font-semibold text-ink-900">
                    {localeLabel[l]}
                  </span>
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                      isSelected ? 'border-sunset-500 bg-sunset-500' : 'border-ink-900/20 bg-white'
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
            className="mt-5 min-h-12 w-full rounded-full bg-sunset-500 py-3 text-[15px] font-semibold text-white shadow-sunset transition-colors hover:bg-sunset-600 disabled:cursor-not-allowed disabled:opacity-50"
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