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
 * Shared primary navigation for desktop, the compact "Plus" menu, and the
 * mobile drawer.
 */
export function usePrimaryNav(): NavLink[] {
  const t = useTranslations('nav');
  return [
    { href: '/', label: t('home') },
    { href: '/promotions', label: t('promotions'), hot: true },
    { href: '/search', label: t('search'), opensSearch: true },
    { href: '/services', label: t('services') },
    { href: '/places', label: t('places') },
    { href: '/communities', label: t('communities') },
    { href: '/sell', label: t('sell') },
    { href: '/map', label: t('map') },
  ];
}
