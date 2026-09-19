// Guest language preference, stored in localStorage.
//
// Future account support: `saveLanguagePreference` is the single write path a
// logged-in user would also call to persist the choice in their profile (and
// `getSavedLanguage` is what a new device would read to restore a known
// account language). The guest path below keeps that contract ready without
// coupling the UI to the account API.
import { locales, type Locale } from '@/i18n/config';

export const LANGUAGE_DONE_KEY = 'medina.languageSelected';
export const LANGUAGE_KEY = 'medina.selectedLanguage';

/** First-visit language selection has been completed on this browser. */
export function hasLanguagePreference(): boolean {
  if (typeof window === 'undefined') return true; // never gate SSR
  try {
    return window.localStorage.getItem(LANGUAGE_DONE_KEY) === '1';
  } catch {
    return true; // storage unavailable → don't trap the user behind a modal
  }
}

export function getSavedLanguage(): Locale | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = window.localStorage.getItem(LANGUAGE_KEY) as Locale | null;
    return saved && (locales as readonly string[]).includes(saved) ? saved : null;
  } catch {
    return null;
  }
}

export function saveLanguagePreference(locale: Locale): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LANGUAGE_DONE_KEY, '1');
    window.localStorage.setItem(LANGUAGE_KEY, locale);
  } catch {
    /* storage unavailable — ignore, keep the app usable */
  }
}

export function clearLanguagePreference(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(LANGUAGE_DONE_KEY);
    window.localStorage.removeItem(LANGUAGE_KEY);
  } catch {
    /* ignore */
  }
}