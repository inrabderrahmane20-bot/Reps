'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { LanguageSwitcher } from './language-switcher';
import { NotificationsBell } from './notifications-bell';
import { Search, ChevronDown, LogOut, User as UserIcon, ShieldCheck, Wrench } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { MobileNavMenu } from './mobile-nav-menu';

export function Navbar() {
  const t = useTranslations('nav');
  const common = useTranslations('common');
  const { user, logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const primaryLinks = [
    { href: '/', label: t('home') },
    { href: '/news', label: t('news') },
    { href: '/services', label: t('services') },
    { href: '/communities', label: t('communities') },
    { href: '/activities', label: t('activities') },
    { href: '/meetings', label: t('meetings') },
    { href: '/map', label: t('map') },
  ];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-900/[0.07] bg-sand-50/90 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-3 px-4 md:px-8 lg:gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-arch bg-majorelle-600 font-display text-base font-bold text-white">
            M
          </span>
          <span className="font-display text-[22px] font-semibold tracking-tight text-ink-900">
            Medina
          </span>
        </Link>

        {/* Primary navigation — grouped pill on desktop */}
        <nav
          className="hidden items-center rounded-full border border-ink-900/[0.07] bg-white/70 p-1 xl:flex"
          aria-label="Primary"
        >
          {primaryLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-full px-3 py-1.5 text-[13.5px] font-medium transition-colors ${
                  active
                    ? 'bg-majorelle-600 text-white'
                    : 'text-ink-700 hover:bg-sand-100 hover:text-majorelle-700'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Utility group */}
        <div className="ms-auto flex items-center gap-1.5 xl:gap-2">
          <span className="hidden h-5 w-px bg-ink-900/[0.1] lg:block" aria-hidden />

          <Link
            href="/search"
            aria-label={t('search')}
            className="hidden h-10 w-10 place-items-center rounded-full text-ink-700 hover:bg-white sm:grid"
          >
            <Search size={18} />
          </Link>
          <NotificationsBell />
          <LanguageSwitcher compact />

          {loading ? null : user ? (
            <div className="relative ms-1" ref={ref}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="hidden items-center gap-2 rounded-full bg-white py-1 pe-3 ps-1 text-sm font-semibold text-ink-900 shadow-card md:flex"
              >
                <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                <span className="max-w-[90px] truncate">{user.firstName}</span>
                <ChevronDown size={14} className={menuOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>
              <Link href="/profile" className="grid h-10 w-10 place-items-center rounded-full md:hidden" aria-label={common('myAccount')}>
                <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
              </Link>
              {menuOpen && (
                <div className="absolute end-0 top-12 z-50 w-56 rounded-2xl bg-white p-1.5 shadow-xl">
                  <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-700 hover:bg-sand-100">
                    <UserIcon size={15} /> {common('myAccount')}
                  </Link>
                  {user.providerStatus === 'approved' && (
                    <Link href="/provider/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-700 hover:bg-sand-100">
                      <Wrench size={15} /> {common('providerDashboard')}
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <a href="/admin" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-700 hover:bg-sand-100">
                      <ShieldCheck size={15} /> {common('adminPanel')}
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm text-clay-500 hover:bg-sand-100"
                  >
                    <LogOut size={15} /> {common('signOut')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-1.5 md:flex">
              <Link
                href="/login"
                className="rounded-full px-3.5 py-2 text-sm font-semibold text-ink-700 hover:bg-white"
              >
                {common('login')}
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-majorelle-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-majorelle-700"
              >
                {t('joinMedina')}
              </Link>
            </div>
          )}
        </div>

        <MobileNavMenu />
      </div>
    </header>
  );
}