'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { Home, Compass, CalendarDays, MessageCircle, User } from 'lucide-react';

export function MobileTabBar() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  const tabs = [
    { href: '/', label: t('home'), icon: Home },
    { href: '/discover', label: t('discover'), icon: Compass },
    { href: '/activities', label: t('activities'), icon: CalendarDays },
    { href: '/messages', label: t('messages'), icon: MessageCircle },
    { href: '/profile', label: t('profile'), icon: User },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-ink-900/10 bg-white/95 backdrop-blur md:hidden"
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
              active ? 'text-majorelle-700' : 'text-ink-500'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={20} strokeWidth={active ? 2.4 : 2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
