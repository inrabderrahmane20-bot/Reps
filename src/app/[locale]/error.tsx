'use client';
import { useTranslations } from 'next-intl';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('common');
  return <div role="alert" className="mx-auto max-w-3xl px-5 py-20">
    <h1 className="text-2xl font-semibold">{t('somethingWentWrong')}</h1>
    <button onClick={reset} className="mt-6 rounded-full bg-majorelle-600 px-6 py-3 text-white">{t('tryAgain')}</button>
  </div>;
}
