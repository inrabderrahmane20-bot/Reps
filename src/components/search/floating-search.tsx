'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ChevronRight, Clock, CornerDownLeft, Search, X } from 'lucide-react';
import { highlightRanges } from '@/lib/search';
import { OPEN_SEARCH_EVENT } from '@/lib/open-search';
import type { SearchGroup, SearchItem, SearchKind } from '@/lib/search-types';

/**
 * Floating global search — an iOS 26 "Liquid Glass" pill.
 *
 * Behaviour
 *   • Idle  : a translucent glass pill pinned to the bottom centre of the
 *              viewport. It is never the only way to reach the search page
 *              and never covers a primary action.
 *   • Active: the pill expands, reveals a real text input (auto-focused), a
 *              clear button and a cancel button. A soft backdrop separates the
 *              search from the page behind it.
 *   • Results are grouped (promotions / services / categories / news /
 *     communities / activities) and rendered in a scrollable glass panel above
 *              the pill.
 *   • Escape closes, ↑/↓ move through the results, Enter opens the highlighted
 *              result and ⌘/Ctrl + K opens the search from anywhere.
 *
 * Mobile: the pill lifts above the on-screen keyboard using the Visual
 * Viewport API, respects the iOS safe-area inset and keeps a 16px input so
 * Safari never zooms the page.
 */

const RECENT_KEY = 'medina.recentSearches';
const DISMISSED_KEY = 'medina.floatingSearch.dismissed';
const MAX_RECENT = 6;
const MAX_RECENT_LENGTH = 60;

type Phase = 'idle' | 'loading' | 'ready' | 'empty';

/** Very small guard so obviously personal input never becomes history. */
function isSensitive(query: string): boolean {
  if (query.includes('@')) return true;
  const digits = query.replace(/\D/g, '');
  if (digits.length >= 8) return true;
  return /\b(pass|password|mot de passe|secret|otp)\b/i.test(query);
}

function readRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === 'string').slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function writeRecent(list: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch {
    /* storage unavailable — the feature is optional */
  }
}

/** Renders text with the matched fragment wrapped in a <mark>. */
function Highlighted({ text, query }: { text: string; query: string }) {
  const ranges = useMemo(() => highlightRanges(text, query), [text, query]);
  if (!ranges.length) return <>{text}</>;

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(([start, end], i) => {
    if (start > cursor) parts.push(<span key={`t${i}`}>{text.slice(cursor, start)}</span>);
    parts.push(
      <mark
        key={`m${i}`}
        className="rounded-[4px] px-[2px]"
        style={{ backgroundColor: 'rgba(249,115,22,0.22)', color: 'inherit' }}
      >
        {text.slice(start, end)}
      </mark>
    );
    cursor = end;
  });
  if (cursor < text.length) parts.push(<span key="tail">{text.slice(cursor)}</span>);
  return <>{parts}</>;
}

export function FloatingSearch() {
  const t = useTranslations('floatingSearch');
  const tSearch = useTranslations('search');
  const locale = useLocale();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestSeq = useRef(0);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  /** Timestamp of the last open — used to swallow the opening gesture's click. */
  const openedAtRef = useRef(0);

  /* ------------------------------------------------------------------ */
  /* Environment                                                         */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Visual Viewport — tracks the on-screen keyboard height on iOS/Android.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardInset(inset);
      setViewportHeight(vv.height);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  useEffect(() => {
    setRecent(readRecent());
    try {
      setDismissed(window.localStorage.getItem(DISMISSED_KEY) === 'true');
    } catch {
      setDismissed(false);
    }
  }, []);

  /* ------------------------------------------------------------------ */
  /* Open / close                                                        */
  /* ------------------------------------------------------------------ */

  const openSearch = useCallback(() => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    // Remember when the overlay opened. The backdrop is mounted *under* the
    // pointer that opened it, so the same gesture's trailing `click` event
    // would otherwise land on the backdrop and close it immediately
    // (classic click-through). The backdrop ignores clicks in a short window
    // after opening; real dismissals happen later than that.
    openedAtRef.current = Date.now();
    setOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setOpen(false);
    // The query is intentionally cleared on close: the pill always returns to
    // its neutral state. Recent searches keep the history.
    setQuery('');
    setGroups([]);
    setTotal(0);
    setActiveIndex(-1);
    abortRef.current?.abort();
    const restore = restoreFocusRef.current;
    restoreFocusRef.current = null;
    if (restore && typeof restore.focus === 'function') {
      window.setTimeout(() => restore.focus(), 0);
    }
  }, []);

  // Global triggers: the custom event (navbar "Recherche") and ⌘/Ctrl + K.
  useEffect(() => {
    const onOpen = () => openSearch();
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (open) closeSearch();
        else openSearch();
      }
    };
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpen);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, openSearch, closeSearch]);

  // Focus the input as soon as the overlay opens.
  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  // Escape closes even when focus moved outside the input.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSearch();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, closeSearch]);

  // Lock the page behind the overlay.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  /* ------------------------------------------------------------------ */
  /* Results                                                             */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (!open) return;
    const handle = window.setTimeout(async () => {
      const seq = ++requestSeq.current;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}&locale=${encodeURIComponent(locale)}`,
          {
            signal: controller.signal,
            credentials: 'same-origin',
          }
        );
        if (!res.ok) throw new Error('search failed');
        const data = await res.json();
        if (seq !== requestSeq.current) return;
        setGroups(Array.isArray(data.groups) ? data.groups : []);
        setTotal(Number(data.total) || 0);
        setActiveIndex(-1);
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        if (seq !== requestSeq.current) return;
        setGroups([]);
        setTotal(0);
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    }, 150);
    return () => window.clearTimeout(handle);
  }, [query, open, locale]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  const indexByKey = useMemo(() => {
    const map = new Map<string, number>();
    let i = 0;
    for (const g of groups) for (const item of g.items) map.set(`${g.key}:${item.id}`, i++);
    return map;
  }, [groups]);

  const phase: Phase = loading
    ? 'loading'
    : !query.trim()
      ? groups.length
        ? 'ready'
        : 'idle'
      : total === 0
        ? 'empty'
        : 'ready';

  /* ------------------------------------------------------------------ */
  /* Navigation                                                          */
  /* ------------------------------------------------------------------ */

  const remember = useCallback((value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2 || trimmed.length > MAX_RECENT_LENGTH) return;
    if (isSensitive(trimmed)) return;
    setRecent((prev) => {
      const next = [trimmed, ...prev.filter((v) => v.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_RECENT);
      writeRecent(next);
      return next;
    });
  }, []);

  const removeRecent = useCallback((value: string) => {
    setRecent((prev) => {
      const next = prev.filter((v) => v !== value);
      writeRecent(next);
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecent([]);
    writeRecent([]);
  }, []);

  const dismissSearch = useCallback(() => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISSED_KEY, 'true');
    } catch {
      // Keep the dismissal for this page when browser storage is unavailable.
    }
  }, []);

  const go = useCallback(
    (item: SearchItem) => {
      remember(query);
      closeSearch();
      router.push(`/${locale}${item.href}`);
    },
    [closeSearch, locale, query, remember, router]
  );

  const submitFullSearch = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    remember(q);
    closeSearch();
    router.push(`/${locale}/search?q=${encodeURIComponent(q)}`);
  }, [closeSearch, locale, query, remember, router]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!flat.length) return;
      setActiveIndex((i) => (i + 1) % flat.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!flat.length) return;
      setActiveIndex((i) => (i <= 0 ? flat.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const entry = activeIndex >= 0 ? flat[activeIndex] : undefined;
      if (entry) go(entry);
      else submitFullSearch();
    }
  };

  /* ------------------------------------------------------------------ */
  /* Geometry                                                            */
  /* ------------------------------------------------------------------ */

  const baseBottom = isDesktop ? 28 : 68;
  const keyboardOpen = keyboardInset > 120;
  const bottom = baseBottom + (keyboardOpen ? keyboardInset + 10 : 0);

  const idleWidth = isDesktop ? 'min(72vw, 520px)' : 'min(92vw, 420px)';
  const openWidth = isDesktop ? 'min(84vw, 560px)' : 'min(94vw, 440px)';
  const shellWidth = open ? openWidth : idleWidth;

  const ih = viewportHeight || 800;
  const panelMaxHeight = keyboardOpen
    ? Math.max(170, Math.min(ih * 0.52, 430))
    : Math.max(200, Math.min(ih * 0.6, 520, ih - 210));

  const mobileIdle = !isDesktop && !open;
  const mobileOpen = !isDesktop && open;
  return (
    <>
      {/* Backdrop — separates the active search from the page behind it. */}
      {open && (
        <div
          className="fs-fade-in fixed inset-0 z-[65] bg-ink-900/25 backdrop-blur-[3px]"
          onPointerDown={(e) => {
            // Ignore the gesture that opened the overlay (click-through).
            if (Date.now() - openedAtRef.current < 350) return;
            e.preventDefault();
            closeSearch();
          }}
          aria-hidden
        />
      )}

      <div
        className={`pointer-events-none fixed inset-x-0 bottom-0 z-[68] flex flex-col px-3 ${
          open || isDesktop ? 'items-center' : 'items-end'
        } ${
          dismissed && !open && !isDesktop ? 'hidden' : ''
        }`}
        style={{
          paddingBottom: isDesktop ? bottom : `calc(${bottom}px + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <div
          className="pointer-events-auto flex flex-col"
          style={{
            width: mobileIdle ? '60px' : shellWidth,
            transition: 'width 320ms cubic-bezier(0.32, 0.72, 0, 1)',
          }}
        >
          {/* ---------------- Results panel ---------------- */}
          {open && (
            <div
              className={`fs-panel-in mb-3 overflow-hidden rounded-[26px] border p-1.5 shadow-[0_18px_55px_rgba(35,25,20,0.24)] ${
                mobileOpen
                  ? 'border-ink-900/10 bg-white'
                  : 'glass border-white/30'
              }`}
              style={{ maxHeight: panelMaxHeight }}
            >
              <div
                id="reps-fs-listbox"
                role="listbox"
                aria-label={tSearch('title')}
                className="overflow-y-auto overscroll-contain [scrollbar-width:thin]"
                style={{ maxHeight: panelMaxHeight - 12 }}
              >
                {/* Recent searches */}
                {!query.trim() && recent.length > 0 && (
                  <div role="group" aria-label={t('recentSearches')}>
                    <div className="flex items-center justify-between px-3 pb-1 pt-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
                        {t('recentSearches')}
                      </p>
                      <button
                        type="button"
                        onClick={clearRecent}
                        className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-ink-500 transition-colors hover:bg-sand-100 hover:text-ink-900"
                      >
                        {t('clearAll')}
                      </button>
                    </div>
                    <ul className="pb-1">
                      {recent.map((entry) => (
                        <li key={entry}>
                          <div className="flex items-center gap-1 px-1">
                            <button
                              type="button"
                              onClick={() => setQuery(entry)}
                              className="flex min-h-[44px] flex-1 items-center gap-3 rounded-2xl px-3 text-start transition-colors hover:bg-white/70"
                            >
                              <Clock size={16} className="shrink-0 text-ink-400" aria-hidden />
                              <span className="min-w-0 flex-1 truncate text-[14px] text-ink-800">{entry}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeRecent(entry)}
                              aria-label={t('removeRecent', { query: entry })}
                              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-400 transition-colors hover:bg-white hover:text-ink-900"
                            >
                              <X size={14} aria-hidden />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Loading */}
                {phase === 'loading' && (
                  <div className="space-y-1.5 p-2" role="status" aria-live="polite">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 px-2 py-2" aria-hidden>
                        <span className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-sand-200/80" />
                        <span className="flex-1 space-y-1.5">
                          <span className="block h-3 w-2/5 animate-pulse rounded-full bg-sand-200/80" />
                          <span className="block h-2.5 w-1/4 animate-pulse rounded-full bg-sand-200/60" />
                        </span>
                      </div>
                    ))}
                    <span className="sr-only">{t('loading')}</span>
                  </div>
                )}

                {/* No results */}
                {phase === 'empty' && (
                  <div className="px-4 py-8 text-center" role="status" aria-live="polite">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-peach-100 text-sunset-600">
                      <Search size={20} aria-hidden />
                    </span>
                    <p className="mt-3 font-display text-[15px] font-semibold text-ink-900">
                      {t('noResultsTitle')}
                    </p>
                    <p className="mx-auto mt-1 max-w-[32ch] text-[13px] leading-relaxed text-ink-500">
                      {t('noResultsBody')}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        closeSearch();
                        router.push(`/${locale}/services`);
                      }}
                      className="mt-4 rounded-full bg-sunset-500 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-sunset-600"
                    >
                      {t('exploreCategories')}
                    </button>
                  </div>
                )}

                {/* Results */}
                {phase === 'ready' && flat.length > 0 && (
                  <>
                    {groups.map((group) => (
                      <div key={group.key} role="group" aria-label={groupLabel(group.key)}>
                        <p className="px-3 pb-1 pt-2.5 text-[11px] font-bold uppercase tracking-wider text-ink-500">
                          {groupLabel(group.key)}
                        </p>
                        <ul className="pb-1">
                          {group.items.map((item) => {
                            const index = indexByKey.get(`${group.key}:${item.id}`) ?? 0;
                            const isActive = index === activeIndex;
                            return (
                              <li key={`${group.key}-${item.id}`}>
                                <button
                                  type="button"
                                  id={`reps-fs-opt-${index}`}
                                  role="option"
                                  aria-selected={isActive}
                                  onMouseEnter={() => setActiveIndex(index)}
                                  onClick={() => go(item)}
                                  className={`flex min-h-[52px] w-full items-center gap-3 rounded-2xl px-3 py-2 text-start transition-colors ${
                                    isActive ? 'bg-white shadow-card' : 'hover:bg-white/70'
                                  }`}
                                >
                                  {item.image ? (
                                    <img
                                      src={item.image}
                                      alt=""
                                      loading="lazy"
                                      className="h-9 w-9 shrink-0 rounded-xl object-cover"
                                    />
                                  ) : (
                                    <span
                                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-peach-100 text-sunset-600"
                                      aria-hidden
                                    >
                                      <Search size={15} />
                                    </span>
                                  )}
                                  <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-2">
                                      <span className="min-w-0 truncate text-[14px] font-semibold text-ink-900">
                                        <Highlighted text={item.title} query={query} />
                                      </span>
                                      {item.badge && (
                                        <span className="shrink-0 rounded-full bg-sunset-500 px-2 py-0.5 text-[10.5px] font-bold text-white">
                                          {item.badge}
                                        </span>
                                      )}
                                    </span>
                                    {item.subtitle && (
                                      <span className="mt-0.5 block truncate text-[12.5px] text-ink-500">
                                        <Highlighted text={item.subtitle} query={query} />
                                      </span>
                                    )}
                                  </span>
                                  <ChevronRight
                                    size={15}
                                    className="flip-rtl shrink-0 text-ink-300"
                                    aria-hidden
                                  />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}

                    {/* Full search CTA */}
                    <div className="border-t border-ink-900/[0.06] p-1.5">
                      <button
                        type="button"
                        onClick={submitFullSearch}
                        className="flex min-h-[44px] w-full items-center gap-3 rounded-2xl px-3 text-[13.5px] font-semibold text-sunset-700 transition-colors hover:bg-white/80"
                      >
                        <CornerDownLeft size={15} aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-start">
                          {t('seeAllResults', { query: query.trim() })}
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ---------------- Glass pill ---------------- */}
          {/* `w-full` is essential: the faces inside are absolutely positioned,
              so without an explicit width the pill would collapse to its own
              padding (a 2px sliver) instead of filling the shell.            */}
          <div
            className={`${
              mobileIdle
                ? 'relative flex items-center justify-center rounded-full border-2 border-white bg-sunset-500 text-white shadow-[0_8px_28px_rgba(60,35,20,0.36)] ring-1 ring-sunset-700/30 mobile-search-pulse'
                : mobileOpen
                  ? 'relative overflow-hidden rounded-full border border-ink-900/10 bg-white shadow-[0_14px_40px_rgba(35,25,20,0.22)]'
                  : 'glass relative overflow-hidden rounded-full'
            } w-full`}
            style={{ height: mobileIdle ? 60 : 54 }}
          >
            {/* Idle face */}
            <div
              className={`${mobileIdle ? 'relative h-full w-full' : 'absolute inset-0'} transition-opacity duration-200 ${
                open ? 'pointer-events-none opacity-0' : 'opacity-100'
              }`}
              aria-hidden={open}
            >
              <button
                type="button"
                onClick={openSearch}
                aria-label={t('openLabel')}
                className={`flex h-full w-full items-center gap-3 text-start ${
                  mobileIdle ? 'justify-center rounded-full' : 'ps-5 pe-12'
                }`}
              >
                <Search
                  size={20}
                  className={`shrink-0 ${mobileIdle ? 'text-white' : 'text-sunset-600'}`}
                  aria-hidden
                />
                {!mobileIdle && (
                  <>
                    <span className="min-w-0 flex-1 truncate text-[15px] text-ink-500">{t('placeholder')}</span>
                    {!isDesktop && (
                      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-ink-300">
                        {t('shortcut')}
                      </span>
                    )}
                  </>
                )}
              </button>
              {mobileIdle && (
                <button
                  type="button"
                  onClick={dismissSearch}
                  aria-label={t('dismissButton')}
                  title={t('dismissButton')}
                  className="absolute -left-2 -top-2 grid h-7 w-7 place-items-center rounded-full border border-ink-900/10 bg-white text-ink-500 shadow-md transition-colors hover:text-ink-900"
                >
                  <X size={13} aria-hidden />
                </button>
              )}
            </div>

            {/* Active face */}
            <div
              className={`${mobileIdle ? 'hidden' : 'absolute inset-0'} transition-opacity duration-200 ${
                open ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
              aria-hidden={!open}
            >
              <div role="search" className="flex h-full w-full items-center gap-2 ps-4 pe-1.5">
                <Search size={18} className="shrink-0 text-sunset-600" aria-hidden />
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  disabled={!open}
                  role="combobox"
                  aria-expanded={open}
                  aria-controls="reps-fs-listbox"
                  aria-autocomplete="list"
                  aria-activedescendant={activeIndex >= 0 ? `reps-fs-opt-${activeIndex}` : undefined}
                  aria-label={t('inputLabel')}
                  placeholder={t('placeholder')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-ink-900 outline-none placeholder:text-ink-400 disabled:opacity-100"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      inputRef.current?.focus();
                    }}
                    aria-label={t('clear')}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-500 transition-colors hover:bg-white/80 hover:text-ink-900"
                  >
                    <X size={15} aria-hidden />
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeSearch}
                  aria-label={t('cancel')}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-900/[0.06] text-ink-700 transition-colors hover:bg-ink-900/10"
                >
                  <X size={17} aria-hidden />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  function groupLabel(key: SearchKind): string {
    switch (key) {
      case 'promotion':
        return t('groupPromotions');
      case 'service':
        return tSearch('categoryServices');
      case 'category':
        return t('groupCategories');
      case 'news':
        return tSearch('categoryNews');
      case 'community':
        return tSearch('categoryCommunities');
      case 'activity':
        return tSearch('categoryActivities');
      default:
        return tSearch('title');
    }
  }
}
