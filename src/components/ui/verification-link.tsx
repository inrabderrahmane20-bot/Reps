'use client';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function VerificationLink() {
  const t = useTranslations('trust');
  return <Link href="/verification" className="inline-block text-sm text-majorelle-700 underline underline-offset-4">{t('verificationLink')}</Link>;
}
