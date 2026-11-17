import { TrustPage, trustMetadata } from '@/components/trust-page';
import { GlobalDocument } from '@/components/visual-editor/global-document';
import type { Locale } from '@/i18n/config';
export async function generateMetadata({ params: pendingparams }: { params: Promise<{ locale: Locale }> }) {
  const params = await pendingparams;
 return trustMetadata(params.locale, 'privacy'); }
export default async function Page({ params: pendingparams }: { params: Promise<{ locale: Locale }> }) {
  const params = await pendingparams;

  return <GlobalDocument id="privacy" locale={params.locale}><TrustPage locale={params.locale} kind="privacy" /></GlobalDocument>;
}
