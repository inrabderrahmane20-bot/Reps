'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { ChevronDown, Percent, Search, Star } from 'lucide-react';
import { openCategorySearch } from '@/lib/open-category-search';
import { Brand } from './brand';
import { LanguageSwitcher } from './language-switcher';
import { AccountMenu } from './account-menu';
import { NotificationsBell } from './notifications-bell';
import { MobileNavMenu } from './mobile-nav-menu';
import { usePrimaryNav } from './nav-links';

/**
 * The single page header.
 *
 * Two rows live inside one `<header>`:
 *   • a compact bar for phones/tablets — the hamburger is pinned to the
 *     physical LEFT (also in Arabic: the row is explicitly `dir="ltr"` so the
 *     layout is *not* mirrored), the wordmark sits next to it and the
 *     language + account actions sit on the opposite side.
 *   • a full bar from `lg` up — wordmark, the primary navigation (Home →
 *     Promotions → Search → …) and the utility group.
 *
 * Between 1024 and 1279 the nine primary destinations do not fit next to the
 * utility group, so the tail of the list moves into a "Plus" menu. From 1280
 * the complete list is visible.
 */
export function Navbar() {
  const t = useTranslations('nav');
  const links = usePrimaryNav();
  const desktopLinks = links.filter((link) => !link.opensSearch);
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // The first four destinations are always visible; the rest live in "Plus".
  const primary = desktopLinks.slice(0, 4);
  const overflow = desktopLinks.slice(4);

  useEffect(() => {
    if (!moreOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMoreOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  useEffect(() => setMoreOpen(false), [pathname]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-ink-900/[0.07] bg-sand-50/88 backdrop-blur-xl backdrop-saturate-150">
      {/* ---------------------------------------------------------------- */}
      {/* Compact bar — phones and small tablets                          */}
      {/* ---------------------------------------------------------------- */}
      {/* `dir="ltr"` is deliberate: the hamburger must stay physically on */}
      {/* the LEFT in Arabic too, so the bar is never mirrored.           */}
      <div dir="ltr" className="mx-auto flex h-16 max-w-[1720px] items-center gap-2 px-3 lg:hidden">
        <MobileNavMenu />

        <Brand />

        <div className="ms-auto flex items-center gap-1.5">
          <Link
            href="/favorites"
            aria-label={t('favorites')}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-600 transition-colors hover:bg-white hover:text-sunset-700"
          >
            <Star size={18} />
          </Link>
          <LanguageSwitcher variant="short" />
          <AccountMenu compact />
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Full bar — desktop                                               */}
      {/* ---------------------------------------------------------------- */}
      <div className="mx-auto hidden h-[68px] max-w-[1720px] items-center gap-3 px-4 md:px-6 lg:flex xl:px-8">
        <Brand />

        <nav aria-label={t('primaryNav')} className="flex min-w-0 items-center gap-0.5">
          {/* Complete list from 1280 up */}
          <ul className="hidden items-center gap-0.5 xl:flex">
            {desktopLinks.map((link) => (
              <li key={link.href}>
                <NavItem link={link} active={isActive(link.href)} />
              </li>
            ))}
          </ul>

          {/* Compact list between 1024 and 1279 */}
          <ul className="flex items-center gap-0.5 xl:hidden">
            {primary.map((link) => (
              <li key={link.href}>
                <NavItem link={link} active={isActive(link.href)} />
              </li>
            ))}
          </ul>

          {overflow.length > 0 && (
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={moreOpen}
                className="flex h-9 items-center gap-1 rounded-full px-2.5 text-[13px] font-medium text-ink-700 transition-colors hover:bg-white hover:text-sunset-700 xl:hidden"
              >
                {t('more')}
                <ChevronDown
                  size={14}
                  className={`text-ink-400 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>
              {moreOpen && (
                <ul
                  role="menu"
                  className="absolute start-0 top-11 z-50 w-56 overflow-hidden rounded-2xl border border-ink-900/[0.07] bg-white/95 p-1.5 shadow-float backdrop-blur"
                >
                  {overflow.map((link) => (
                    <li key={link.href}>
                      <NavItem link={link} active={isActive(link.href)} menu />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </nav>

        {/* Utility group */}
        <div className="ms-auto flex shrink-0 items-center gap-1.5">
          <Link
            href="/favorites"
            aria-label={t('favorites')}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-600 transition-colors hover:bg-white hover:text-sunset-700"
            title={t('favorites')}
          >
            <Star size={18} />
          </Link>
          <NotificationsBell />
          <LanguageSwitcher />
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}

/**
 * A single navigation entry. "Promotions" gets the warm, high-contrast
 * treatment so it is visibly the second-most important destination;
 * "Recherche" opens the floating global search instead of navigating.
 */
function NavItem({
  link,
  active,
  menu = false,
}: {
  link: { href: string; label: string; hot?: boolean; opensSearch?: boolean };
  active: boolean;
  menu?: boolean;
}) {
  const shared = [
    'flex items-center gap-1.5 rounded-full text-[13px] font-medium transition-colors',
    menu ? 'w-full px-3 py-2.5 text-start' : 'px-2.5 py-2',
  ].join(' ');

  const tone = active
    ? 'bg-sunset-500 text-white shadow-sunset'
    : link.hot
      ? 'bg-peach-100 font-semibold text-sunset-700 ring-1 ring-inset ring-sunset-200 hover:bg-peach-200 hover:text-sunset-800'
      : 'text-ink-700 hover:bg-white hover:text-sunset-700';

  const inner = (
    <>
      {link.hot && <Percent size={14} strokeWidth={2.6} aria-hidden />}
      {link.opensSearch && !link.hot && <Search size={14} strokeWidth={2.2} aria-hidden />}
      <span className="whitespace-nowrap">{link.label}</span>
    </>
  );

  if (link.opensSearch) {
    return (
      <button
        type="button"
        onClick={openCategorySearch}
        aria-label={link.label}
        className={`${shared} ${tone}`}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link
      href={link.href}
      aria-current={active ? 'page' : undefined}
      className={`${shared} ${tone}`}
    >
      {inner}
    </Link>
  );
}
