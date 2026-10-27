'use client';

import { useTranslations } from 'next-intl';

export interface NavLink {
  href: string;
  label: string;
  /** Promotions get the warm orange treatment. */
  hot?: boolean;
  /** Opens the global floating search instead of navigating. */
  opensSearch?: boolean;
}

/**
 * Primary navigation order — Home, Promotions, Search, then the remaining
 * destinations in a logical order. Shared by the desktop bar, the compact
 * "Plus" menu and the mobile drawer so the two never drift apart.
 */
export function usePrimaryNav(): NavLink[] {
  const t = useTranslations('nav');
  return [
    { href: '/', label: t('home') },
    { href: '/promotions', label: t('promotions'), hot: true },
    { href: '/search', label: t('search'), opensSearch: true },
    { href: '/services', label: t('services') },
    { href: '/news', label: t('news') },
    { href: '/communities', label: t('communities') },
    { href: '/activities', label: t('activities') },
    { href: '/meetings', label: t('meetings') },
    { href: '/map', label: t('map') },
    { href: '/places', label: t('places') },
    { href: '/sell', label: t('sell') },
  ];
}
