import { TrustPage, trustMetadata } from '@/components/trust-page';
import { GlobalDocument } from '@/components/visual-editor/global-document';
import type { Locale } from '@/i18n/config';
export async function generateMetadata({ params: pendingparams }: { params: Promise<{ locale: Locale }> }) {
  const params = await pendingparams;
 return trustMetadata(params.locale, 'rules'); }
export default async function Page({ params: pendingparams }: { params: Promise<{ locale: Locale }> }) {
  const params = await pendingparams;

  return <GlobalDocument id="rules" locale={params.locale}><TrustPage locale={params.locale} kind="rules" /></GlobalDocument>;
}
