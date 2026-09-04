'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales, localeLabel, type Locale } from '@/i18n/config';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      role="group"
      aria-label="Language"
      className="flex items-center gap-0.5 rounded-full border border-ink-900/10 bg-white p-0.5 text-sm"
    >
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => router.replace(pathname, { locale: l })}
          aria-current={locale === l ? 'true' : undefined}
          className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
            locale === l
              ? 'bg-majorelle-600 text-white'
              : 'text-ink-500 hover:bg-sand-100 hover:text-ink-900'
          }`}
        >
          {compact ? l.toUpperCase() : localeLabel[l]}
        </button>
      ))}
    </div>
  );
}
