import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LanguageSwitcher } from './language-switcher';
import { Search, Bell } from 'lucide-react';
import { AuthNav } from './auth-nav';

export function Navbar() {
  const t = useTranslations('nav');

  const primaryLinks = [
    { href: '/', label: t('home') },
    { href: '/news', label: t('news') },
    { href: '/services', label: t('services') },
    { href: '/communities', label: t('communities') },
    { href: '/activities', label: t('activities') },
    { href: '/meetings', label: t('meetings') },
    { href: '/map', label: t('map') },
  ];

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
          <button
            type="button"
            aria-label={t('notifications')}
            className="relative hidden h-10 w-10 place-items-center rounded-full text-ink-700 hover:bg-white sm:grid"
          >
            <Bell size={18} />
            <span className="absolute end-2 top-2 h-2 w-2 rounded-full bg-clay-400" />
          </button>
          <LanguageSwitcher compact />
          <div className="hidden md:block"><AuthNav /></div>
        </div>
      </div>
    </header>
  );
}
