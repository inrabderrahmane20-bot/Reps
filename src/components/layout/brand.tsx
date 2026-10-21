'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/**
 * The REPS / Medina wordmark. Shared by the desktop bar, the mobile bar and
 * the footer so the brand mark stays identical everywhere.
 */
export function Brand({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  const t = useTranslations('nav');
  return (
    <Link
      href="/"
      className={`flex shrink-0 items-center gap-2.5 ${className}`}
      aria-label={t('brandHome', { name: 'Medina' })}
    >
      <span
        className="grid h-9 w-9 place-items-center rounded-[13px] bg-gradient-to-br from-sunset-400 via-sunset-500 to-sunset-600 font-display text-[17px] font-bold text-white shadow-sunset"
        aria-hidden
      >
        M
      </span>
      {!compact && (
        <span className="font-display text-[21px] font-semibold tracking-tight text-ink-900">Medina</span>
      )}
    </Link>
  );
}
