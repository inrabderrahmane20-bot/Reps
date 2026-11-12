'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { Compass, Heart, Home, User } from 'lucide-react';

/**
 * Fixed mobile bottom navigation.
 *
 * Four primary destinations mirroring the redesigned homepage: home, explore,
 * favorites and account. The active item keeps a terracotta indicator and a
 * soft beige capsule so the current section is obvious while scrolling.
 */
export function MobileTabBar() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  const tabs = [
    { href: '/', label: t('home'), icon: Home, exact: true },
    { href: '/discover', label: t('discover'), icon: Compass, exact: false },
    { href: '/favorites', label: t('favorites'), icon: Heart, exact: false },
    { href: '/profile', label: t('account'), icon: User, exact: false },
  ];

  return (
    <nav aria-label={t('primaryNav')} className="mobile-tab-bar">
      {tabs.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`mobile-tab-bar-item${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="mobile-tab-bar-icon">
              <Icon size={20} strokeWidth={active ? 2.3 : 1.9} aria-hidden />
            </span>
            <span className="mobile-tab-bar-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
