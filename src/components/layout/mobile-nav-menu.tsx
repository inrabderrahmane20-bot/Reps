'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { Menu, X, Search } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { LanguageSwitcher } from './language-switcher';
import { useAuth } from '@/context/auth-context';

/**
 * Hamburger + slide-in navigation drawer for mobile/tablet widths.
 *
 * The drawer is rendered through a portal into <body>: the header uses
 * `backdrop-filter` (backdrop-blur), which makes it the containing block for
 * any `position: fixed` descendant. Without the portal the full-screen overlay
 * would be trapped inside the 68px-tall header and the menu would never appear.
 */
export function MobileNavMenu() {
  const t = useTranslations('nav');
  const common = useTranslations('common');
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: '/', label: t('home') },
    { href: '/news', label: t('news') },
    { href: '/services', label: t('services') },
    { href: '/communities', label: t('communities') },
    { href: '/activities', label: t('activities') },
    { href: '/meetings', label: t('meetings') },
    { href: '/map', label: t('map') },
  ];

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  // `open` can only become true through a click, i.e. after the client has
  // hydrated, so `createPortal(..., document.body)` is never evaluated during
  // SSR or the first client render.
  const drawer =
    open &&
    createPortal(
      <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={t('more')}>
        <div
          className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
          aria-hidden
        />
        <div className="absolute inset-y-0 end-0 flex w-[min(85vw,340px)] flex-col bg-sand-50 shadow-float">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-ink-900/[0.07] px-5 py-4">
            <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
              <span className="grid h-9 w-9 place-items-center rounded-arch bg-majorelle-600 font-display text-base font-bold text-white">
                M
              </span>
              <span className="font-display text-[22px] font-semibold tracking-tight text-ink-900">Medina</span>
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={common('close')}
              className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink-500 shadow-card transition-colors hover:text-ink-900"
            >
              <X size={18} />
            </button>
          </div>

          {/* Primary navigation */}
          <nav aria-label="Primary" className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            <ul className="space-y-0.5">
              {links.map((link) => {
                const active = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[15px] font-medium transition-colors ${
                        active ? 'bg-majorelle-600 text-white' : 'text-ink-700 hover:bg-white'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link
                  href="/search"
                  className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[15px] font-medium text-ink-700 transition-colors hover:bg-white"
                >
                  <Search size={16} />
                  {t('search')}
                </Link>
              </li>
            </ul>

            <div className="my-4 border-t border-ink-900/[0.07]" />

            <div className="px-1.5">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-300">{t('language')}</p>
              <LanguageSwitcher />
            </div>

            <div className="my-4 border-t border-ink-900/[0.07]" />

            <div className="space-y-2 px-1.5">
              {user ? (
                <>
                  <Link href="/profile" className="flex items-center gap-2.5 rounded-full bg-white p-1.5 pe-4 shadow-card">
                    <img src={user.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900">
                      {user.firstName} {user.lastName}
                    </span>
                  </Link>
                  <Link
                    href="/profile"
                    className="block rounded-full border border-ink-900/10 bg-white px-4 py-2.5 text-center text-sm font-semibold text-ink-700"
                  >
                    {common('myAccount')}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block rounded-full border border-ink-900/10 bg-white px-4 py-2.5 text-center text-sm font-semibold text-ink-700"
                  >
                    {common('login')}
                  </Link>
                  <Link
                    href="/register"
                    className="block rounded-full bg-majorelle-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-majorelle-700"
                  >
                    {t('joinMedina')}
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('openMenu')}
        aria-expanded={open}
        className="grid h-10 w-10 place-items-center rounded-full text-ink-700 transition-colors hover:bg-white xl:hidden"
      >
        <Menu size={21} />
      </button>

      {drawer}
    </>
  );
}