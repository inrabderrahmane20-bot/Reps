'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { Compass, CalendarDays, MessageCircle, User } from 'lucide-react';

export function MobileTabBar() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  const tabs = [
    { href: '/discover', label: t('discover'), icon: Compass },
    { href: '/activities', label: t('activities'), icon: CalendarDays },
    { href: '/messages', label: t('messages'), icon: MessageCircle },
    { href: '/profile', label: t('profile'), icon: User },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex w-full min-w-0 items-stretch justify-around overflow-hidden border-t border-ink-900/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-1 overflow-hidden px-0.5 py-2 text-[11px] font-medium transition-colors ${
              active ? 'text-sunset-700' : 'text-ink-500'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            <span
              className={`grid h-7 w-9 shrink-0 place-items-center rounded-full transition-colors ${
                active ? 'bg-peach-100 text-sunset-600' : ''
              }`}
            >
              <Icon size={19} strokeWidth={active ? 2.4 : 2} />
            </span>
            <span className="w-full truncate text-center leading-tight">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
