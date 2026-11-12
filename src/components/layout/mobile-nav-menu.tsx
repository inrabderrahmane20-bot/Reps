'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  CalendarDays,
  Compass,
  Heart,
  Home,
  LogOut,
  Map,
  Menu,
  Newspaper,
  Percent,
  Search,
  UsersRound,
  X,
} from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { openGlobalSearch } from '@/lib/open-search';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import { SEARCH_CATEGORIES, type SearchCategoryNode } from '@/lib/category-tree';
import type { NavbarContent } from '@/lib/visual-editor/types';
import { Brand } from './brand';
import { CityPicker } from './city-picker';
import { LanguageSwitcher } from './language-switcher';
import { MobileCategoryTree } from './mobile-category-tree';
import { NotificationsBell } from './notifications-bell';

const DRAWER_CLOSE_MS = 280;

/**
 * Hamburger + premium navigation drawer for phones and tablets.
 *
 * The trigger is rendered by the navbar in the *physical* left slot of the
 * compact bar, and the drawer starts at that same physical edge — including in
 * Arabic, where the page direction is RTL but the button stays on the left.
 * Inside the drawer the reading direction follows the page language.
 */
export function MobileNavMenu({ content }: { content?: NavbarContent } = {}) {
  const t = useTranslations('nav');
  const footer = useTranslations('footer');
  const common = useTranslations('common');
  const home = useTranslations('home');
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<SearchCategoryNode[]>(SEARCH_CATEGORIES);
  const [query, setQuery] = useState('');

  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const openRef = useRef(false);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const closeDrawer = useCallback((restoreFocus = true) => {
    setOpen(false);
    setQuery('');
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    closeTimer.current = window.setTimeout(
      () => {
        setMounted(false);
        closeTimer.current = null;
        if (restoreFocus) triggerRef.current?.focus();
      },
      reduced ? 0 : DRAWER_CLOSE_MS
    );
  }, []);

  const openDrawer = useCallback(() => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setMounted(true);
    setOpen(true);
  }, []);

  // Refresh the live admin tree every time the drawer opens.
  useEffect(() => {
    if (!mounted) return;
    api
      .get<{ categories: SearchCategoryNode[] }>('/categories/tree')
      .then((response) => {
        if (response.categories?.length) setCategories(response.categories);
      })
      .catch((error) => console.error('Could not load the current category tree.', error));
  }, [mounted]);

  // Close after a route change, without stealing focus from the new page.
  useEffect(() => {
    if (openRef.current) closeDrawer(false);
  }, [pathname, closeDrawer]);

  // Lock the page behind the drawer.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Escape, focus placement and a simple focus trap.
  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDrawer();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKey);
    const id = window.setTimeout(() => closeRef.current?.focus(), 60);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(id);
    };
  }, [open, closeDrawer]);

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    []
  );

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  const defaultMainLinks = [
    { href: '/', label: t('home'), icon: Home },
    { href: '/discover', label: t('discover'), icon: Compass },
    { href: '/map', label: t('map'), icon: Map },
    { href: '/favorites', label: t('favorites'), icon: Heart },
  ];

  const defaultMoreLinks = [
    { href: '/news', label: t('news'), icon: Newspaper },
    { href: '/activities', label: t('activities'), icon: CalendarDays },
    { href: '/meetings', label: t('meetings'), icon: UsersRound },
  ];

  const mainLinks = content?.mobileLinks ? content.mobileLinks.map(link => ({ ...link, icon: defaultMainLinks.find(item => item.href === link.href)?.icon ?? Compass })) : defaultMainLinks;
  const moreLinks = content?.mobileMoreLinks ? content.mobileMoreLinks.map(link => ({ ...link, icon: defaultMoreLinks.find(item => item.href === link.href)?.icon ?? Compass })) : defaultMoreLinks;

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const value = query.trim();
    closeDrawer(false);
    window.setTimeout(() => openGlobalSearch(value), DRAWER_CLOSE_MS);
  }

  async function signOut() {
    await logout();
    closeDrawer();
  }

  const drawer =
    mounted &&
    createPortal(
      <div
        className={`annabid-drawer-root${open ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('openMenu')}
      >
        <div className="annabid-drawer-overlay" onClick={() => closeDrawer()} aria-hidden />

        <div className="annabid-drawer-panel" ref={panelRef}>
          <header className="annabid-drawer-header">
            <Brand className="annabid-drawer-brand" name={content?.brandName} arabicName={content?.arabicName} image={content?.brandImage} />
            <div className="annabid-drawer-header-actions">
              <NotificationsBell />
              <button
                ref={closeRef}
                type="button"
                onClick={() => closeDrawer()}
                aria-label={common('close')}
                className="annabid-drawer-close"
              >
                <X size={19} aria-hidden />
              </button>
            </div>
          </header>

          <div className="annabid-drawer-scroll">
            <div className="annabid-drawer-location">
              <CityPicker />
            </div>

            <form role="search" className="annabid-drawer-search" onSubmit={submitSearch}>
              <Search size={17} className="annabid-drawer-search-icon" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('drawerSearchPlaceholder')}
                aria-label={t('drawerSearchPlaceholder')}
                className="annabid-drawer-search-input"
              />
              <button type="submit" className="annabid-drawer-search-go" aria-label={home('searchButton')}>
                <Search size={15} aria-hidden />
              </button>
            </form>

            <Link
              href="/promotions"
              onClick={() => closeDrawer(false)}
              className="annabid-drawer-promo"
            >
              <span className="annabid-drawer-promo-icon" aria-hidden>
                <Percent size={17} strokeWidth={2.5} />
              </span>
              <span className="annabid-drawer-promo-copy">
                <strong>{home('offersBannerTitle')}</strong>
                <span>{home('offersBannerSubtitle')}</span>
              </span>
              <span className="annabid-drawer-promo-arrow" aria-hidden>
                →
              </span>
            </Link>

            <nav aria-label={t('primaryNav')} className="annabid-drawer-section">
              <p className="annabid-drawer-eyebrow">{t('sectionNavigation')}</p>
              <ul className="annabid-drawer-main-links">
                {mainLinks.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => closeDrawer(false)}
                        aria-current={active ? 'page' : undefined}
                        className={`annabid-drawer-main-link${active ? ' is-active' : ''}`}
                      >
                        <Icon size={18} strokeWidth={active ? 2.3 : 1.9} aria-hidden />
                        <span>{label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <section className="annabid-drawer-section" aria-labelledby="annabid-categories-title">
              <p className="annabid-drawer-eyebrow" id="annabid-categories-title">
                {t('sectionCategories')}
              </p>
              <MobileCategoryTree
                categories={categories}
                onNavigate={() => closeDrawer(false)}
              />
            </section>

            <section className="annabid-drawer-section" aria-labelledby="annabid-more-title">
              <p className="annabid-drawer-eyebrow" id="annabid-more-title">
                {t('sectionMore')}
              </p>
              <ul className="annabid-drawer-more-links">
                {moreLinks.map(({ href, label, icon: Icon }) => (
                  <li key={href}>
                    <Link href={href} onClick={() => closeDrawer(false)}>
                      <Icon size={16} aria-hidden />
                      <span>{label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="annabid-drawer-section" aria-labelledby="annabid-account-title">
              <p className="annabid-drawer-eyebrow" id="annabid-account-title">
                {t('sectionAccount')}
              </p>

              {user ? (
                <div className="annabid-drawer-account">
                  <Link href="/profile" onClick={() => closeDrawer(false)} className="annabid-drawer-user">
                    <Image
                      src={user.avatar}
                      alt=""
                      width={42}
                      height={42}
                      className="annabid-drawer-avatar"
                    />
                    <span className="annabid-drawer-user-copy">
                      <strong>
                        {user.firstName} {user.lastName}
                      </strong>
                      <span>{t('profile')}</span>
                    </span>
                  </Link>

                  <div className="annabid-drawer-account-links">
                    <Link href="/profile" onClick={() => closeDrawer(false)}>
                      {common('myAccount')}
                    </Link>
                    {user.providerStatus === 'approved' ? (
                      <Link href="/provider/dashboard" onClick={() => closeDrawer(false)}>
                        {common('providerDashboard')}
                      </Link>
                    ) : null}
                    {user.role === 'admin' ? (
                      <a href="/admin" onClick={() => closeDrawer(false)}>
                        {common('adminPanel')}
                      </a>
                    ) : null}
                  </div>

                  <button type="button" onClick={signOut} className="annabid-drawer-signout">
                    <LogOut size={16} aria-hidden />
                    {common('signOut')}
                  </button>
                </div>
              ) : (
                <div className="annabid-drawer-auth">
                  <Link href="/login" onClick={() => closeDrawer(false)} className="annabid-drawer-login">
                    {common('login')}
                  </Link>
                  <Link href="/register" onClick={() => closeDrawer(false)} className="annabid-drawer-register">
                    {t('joinAnnabid')}
                  </Link>
                </div>
              )}
            </section>

            <section className="annabid-drawer-section">
              <p className="annabid-drawer-eyebrow">{t('language')}</p>
              <LanguageSwitcher
                wrapperClassName="flex w-full"
                className="annabid-drawer-lang-trigger w-full justify-between"
              />
            </section>

            <div className="annabid-drawer-info">
              <Link href="/rules" onClick={() => closeDrawer(false)}>
                {footer('rules')}
              </Link>
              <Link href="/privacy" onClick={() => closeDrawer(false)}>
                {footer('privacy')}
              </Link>
              <Link href="/terms" onClick={() => closeDrawer(false)}>
                {footer('terms')}
              </Link>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openDrawer}
        aria-label={t('openMenu')}
        aria-expanded={open}
        className="annabid-menu-trigger"
      >
        <Menu size={21} aria-hidden />
      </button>

      {drawer}
    </>
  );
}
