'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ChevronRight, Menu, Percent, X } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { openGlobalSearch } from '@/lib/open-search';
import { useAuth } from '@/context/auth-context';
import { Brand } from './brand';
import { LanguageSwitcher } from './language-switcher';
import { usePrimaryNav } from './nav-links';

/**
 * Hamburger + full-screen navigation overlay for phones and tablets.
 *
 * The trigger is rendered by the navbar in the *physical* left slot of the
 * compact bar, and the reveal starts at that same physical edge — including in
 * Arabic, where the page direction is RTL but the button stays on the left.
 *
 * Inside the drawer the reading direction follows the page language: in
 * Arabic the labels are right-aligned and the leading icon sits on the right,
 * exactly like the rest of the interface.
 *
 * The drawer is rendered through a portal into <body>: the header uses
 * `backdrop-filter` (backdrop-blur), which makes it the containing block for
 * any `position: fixed` descendant. Without the portal the full-screen overlay
 * would be trapped inside the header and the menu would never appear.
 */
export function MobileNavMenu() {
  const t = useTranslations('nav');
  const common = useTranslations('common');
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const closeRef = useRef<HTMLButtonElement>(null);
  const links = usePrimaryNav();

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    const id = window.setTimeout(() => closeRef.current?.focus(), 40);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(id);
    };
  }, [open]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  // `open` can only become true through a click, i.e. after the client has
  // hydrated, so `createPortal(..., document.body)` is never evaluated during
  // SSR or the first client render.
  const drawer =
    open &&
    createPortal(
      <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={t('openMenu')}>
        <div
          className="absolute inset-0 bg-ink-900/45 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
          aria-hidden
        />
        <div className="mobile-nav-panel absolute inset-0 flex min-h-0 flex-col bg-sand-50">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-ink-900/[0.07] px-4 py-3.5">
            <Brand />
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label={common('close')}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-ink-500 shadow-card transition-colors hover:text-ink-900"
            >
              <X size={18} />
            </button>
          </div>

          {/* Primary navigation */}
          <nav aria-label={t('primaryNav')} className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            <ul className="space-y-1">
              {links.map((link) => {
                const active = isActive(link.href);
                const tone = link.hot
                  ? active
                    ? 'border-sunset-500 bg-sunset-500 font-semibold text-white shadow-sunset hover:bg-sunset-600'
                    : 'border-sunset-300 bg-peach-100 font-semibold text-sunset-700'
                  : active || link.opensSearch
                    ? 'border-blue-600 bg-blue-600 font-semibold text-white shadow-md hover:border-blue-700 hover:bg-blue-700'
                    : 'border-blue-200/80 bg-white/85 text-ink-700 hover:border-blue-300 hover:bg-white';

                const inner = (
                  <>
                    {link.hot && <Percent size={16} strokeWidth={2.6} aria-hidden />}
                    <span className="min-w-0 flex-1 truncate">{link.label}</span>
                    {link.hot && !active && (
                      <ChevronRight size={15} className="flip-rtl shrink-0 text-sunset-400" aria-hidden />
                    )}
                  </>
                );

                return (
                  <li key={link.href}>
                    {link.opensSearch ? (
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          window.setTimeout(openGlobalSearch, 120);
                        }}
                        className={`flex min-h-[46px] w-full items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-start text-[15px] transition-colors ${tone}`}
                      >
                        {inner}
                      </button>
                    ) : (
                      <Link
                        href={link.href}
                        aria-current={active ? 'page' : undefined}
                        className={`flex min-h-[46px] w-full items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-start text-[15px] transition-colors ${tone}`}
                      >
                        {inner}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="my-4 border-t border-ink-900/[0.07]" />

            <div className="px-1.5">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-300">{t('language')}</p>
              <LanguageSwitcher
                accent="blue"
                wrapperClassName="flex w-full"
                className="h-11 w-full justify-between border-blue-200/80 px-4 text-[14px] hover:border-blue-300"
              />
            </div>

            <div className="my-4 border-t border-ink-900/[0.07]" />

            <div className="space-y-2 px-1.5">
              {user ? (
                <>
                  <Link href="/profile" className="flex min-h-[46px] items-center gap-2.5 rounded-2xl bg-white p-1.5 pe-4 shadow-card">
                    <Image src={user.avatar} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-full object-cover" />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900">
                      {user.firstName} {user.lastName}
                    </span>
                  </Link>
                  <Link
                    href="/profile"
                    className="flex min-h-[46px] items-center justify-center rounded-2xl border border-ink-900/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700"
                  >
                    {common('myAccount')}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex min-h-[46px] items-center justify-center rounded-2xl border border-ink-900/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700"
                  >
                    {common('login')}
                  </Link>
                  <Link
                    href="/register"
                    className="flex min-h-[46px] items-center justify-center rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700"
                  >
                    {t('joinAnnabid')}
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
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-blue-200/80 bg-white/85 text-ink-700 shadow-sm backdrop-blur transition-colors hover:border-blue-300 hover:bg-white lg:hidden"
      >
        <Menu size={21} />
      </button>

      {drawer}
    </>
  );
}
