'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LanguageSwitcher } from './language-switcher';
import { NotificationsBell } from './notifications-bell';
import { Search, ChevronDown, LogOut, User as UserIcon, ShieldCheck, Wrench } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export function Navbar() {
  const t = useTranslations('nav');
  const common = useTranslations('common');
  const { user, logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
    <header className="sticky top-0 z-40 border-b border-ink-900/10 bg-sand-50/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 md:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-arch bg-majorelle-600 text-sm font-bold text-white">
            M
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-ink-900">
            Medina
          </span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label="Primary">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-white hover:text-majorelle-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
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
            <div className="relative" ref={ref}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="hidden items-center gap-2 rounded-full bg-white py-1 pe-3 ps-1 text-sm font-semibold text-ink-900 shadow-card md:flex"
              >
                <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                {user.firstName}
                <ChevronDown size={14} className={menuOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>
              <Link href="/profile" className="grid h-10 w-10 place-items-center rounded-full md:hidden">
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
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-white"
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
      </div>
    </header>
  );
}
