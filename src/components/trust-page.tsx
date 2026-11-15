import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { buildMetadata } from '@/lib/seo';

export type TrustPageKind = 'contact' | 'legal' | 'privacy' | 'terms' | 'rules' | 'verification';

export async function trustMetadata(locale: string, kind: TrustPageKind) {
  const t = await getTranslations({ locale, namespace: 'trust' });
  return buildMetadata({ locale, path: `/${kind}`, title: t(`${kind}Title`),
    description: t(kind === 'verification' ? 'verificationBody' : 'pending'),
    robots: { index: kind === 'verification', follow: true } });
}

export async function TrustPage({ locale, kind }: { locale: string; kind: TrustPageKind }) {
  const t = await getTranslations({ locale, namespace: 'trust' });
  return <article className="mx-auto max-w-3xl px-5 py-16">
    <h1 className="font-display text-3xl font-semibold">{t(`${kind}Title`)}</h1>
    <p className="mt-6 text-base leading-8 text-ink-700">{t(kind === 'verification' ? 'verificationBody' : 'pending')}</p>
    <Link href="/" className="mt-8 inline-block font-semibold text-majorelle-700 underline underline-offset-4">{t('back')}</Link>
  </article>;
}
