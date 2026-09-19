'use client';

import { useTranslations } from 'next-intl';
import { MapPin, ShieldCheck, Wrench } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { LanguageSwitcher } from './language-switcher';
import { useAuth } from '@/context/auth-context';

/**
 * Slim utility bar above the main navbar.
 *
 * Holds the language switcher and account CTAs (Connexion / Rejoindre Medina),
 * leaving the main navbar focused purely on navigation. On small screens the
 * whole bar is hidden — its items live inside the mobile drawer instead, so
 * the phone header stays clean ("Medina ☰").
 */
export function TopUtilityBar() {
  const t = useTranslations('nav');
  const common = useTranslations('common');
  const { user } = useAuth();

  return (
    <div className="hidden border-b border-ink-900/[0.06] bg-sand-100/80 sm:block">
      <div className="mx-auto flex h-10 max-w-[1720px] items-center justify-between gap-3 px-4 md:px-6 xl:px-8">
        {/* Contextual anchor — small platform element using the free space */}
        <p className="flex items-center gap-1.5 truncate text-[12.5px] font-medium text-ink-500">
          <MapPin size={13} className="text-majorelle-600" aria-hidden />
          <span className="truncate">{t('cityLine')}</span>
        </p>

        {/* Center messaging — desktop only, fills the middle space gracefully */}
        <p className="hidden text-[12.5px] font-medium text-ink-400 lg:block">{t('utilityTagline')}</p>

        {/* Right side: language + account actions */}
        <div className="flex shrink-0 items-center gap-2.5">
          <LanguageSwitcher compact />

          {user ? (
            <div className="hidden items-center gap-1 md:flex">
              <span className="hidden h-4 w-px bg-ink-900/10 lg:block" aria-hidden />
              {user.providerStatus === 'approved' && (
                <Link
                  href="/provider/dashboard"
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-semibold text-ink-600 transition-colors hover:bg-white hover:text-majorelle-700"
                >
                  <Wrench size={13} /> {common('providerDashboard')}
                </Link>
              )}
              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-semibold text-ink-600 transition-colors hover:bg-white hover:text-majorelle-700"
                >
                  <ShieldCheck size={13} /> {common('adminPanel')}
                </Link>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-1 md:flex">
              <span className="hidden h-4 w-px bg-ink-900/10 lg:block" aria-hidden />
              <Link
                href="/login"
                className="rounded-full px-3 py-1 text-[12.5px] font-semibold text-ink-600 transition-colors hover:bg-white hover:text-majorelle-700"
              >
                {common('login')}
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-majorelle-600 px-3.5 py-1 text-[12.5px] font-semibold text-white transition-colors hover:bg-majorelle-700"
              >
                {t('joinMedina')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}