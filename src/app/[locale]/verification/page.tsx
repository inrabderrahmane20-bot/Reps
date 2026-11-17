import { TrustPage, trustMetadata } from '@/components/trust-page';

export async function generateMetadata({ params: pendingparams }: { params: Promise<{ locale: string }> }) {
  const params = await pendingparams;

  return trustMetadata(params.locale, 'verification');
}

export default async function Page({ params: pendingparams }: { params: Promise<{ locale: string }> }) {
  const params = await pendingparams;

  return <TrustPage locale={params.locale} kind="verification" />;
}
