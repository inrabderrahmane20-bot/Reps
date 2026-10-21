'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, LogOut, ShieldCheck, User as UserIcon, Wrench } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/context/auth-context';

/**
 * Account cluster — sign-in / sign-up for guests, avatar + dropdown for
 * signed-in users. Lives in the navbar utility group on desktop and as a
 * single avatar button in the mobile bar.
 */
export function AccountMenu({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('nav');
  const common = useTranslations('common');
  const { user, logout, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  if (loading) return <span className="hidden h-10 w-24 lg:block" aria-hidden />;

  if (!user) {
    if (compact) {
      return (
        <Link
          href="/login"
          aria-label={common('login')}
          className="grid h-10 w-10 place-items-center rounded-full border border-ink-900/10 bg-white text-ink-700 transition-colors hover:bg-peach-50 hover:text-sunset-700"
        >
          <UserIcon size={18} aria-hidden />
        </Link>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-full px-3 py-2 text-[13.5px] font-semibold text-ink-700 transition-colors hover:bg-white hover:text-sunset-700"
        >
          {common('login')}
        </Link>
        <Link
          href="/register"
          className="rounded-full bg-sunset-500 px-4 py-2 text-[13.5px] font-semibold text-white shadow-sunset transition-colors hover:bg-sunset-600"
        >
          {t('joinMedina')}
        </Link>
      </div>
    );
  }

  if (compact) {
    return (
      <Link
        href="/profile"
        aria-label={common('myAccount')}
        className="grid h-10 w-10 place-items-center rounded-full border border-ink-900/10 bg-white transition-colors hover:bg-peach-50"
      >
        <img src={user.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
      </Link>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-10 items-center gap-2 rounded-full bg-white py-1 pe-3 ps-1 text-[13.5px] font-semibold text-ink-900 shadow-card transition-colors hover:bg-peach-50"
      >
        <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
        <span className="max-w-[92px] truncate">{user.firstName}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-ink-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute end-0 top-12 z-50 w-56 rounded-2xl border border-ink-900/[0.07] bg-white p-1.5 shadow-float"
        >
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-peach-50"
          >
            <UserIcon size={15} aria-hidden /> {common('myAccount')}
          </Link>
          {user.providerStatus === 'approved' && (
            <Link
              href="/provider/dashboard"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-peach-50"
            >
              <Wrench size={15} aria-hidden /> {common('providerDashboard')}
            </Link>
          )}
          {user.role === 'admin' && (
            <a href="/admin" role="menuitem" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-peach-50">
              <ShieldCheck size={15} aria-hidden /> {common('adminPanel')}
            </a>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm text-clay-600 transition-colors hover:bg-clay-50"
          >
            <LogOut size={15} aria-hidden /> {common('signOut')}
          </button>
        </div>
      )}
    </div>
  );
}
