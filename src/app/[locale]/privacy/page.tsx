import { TrustPage, trustMetadata } from '@/components/trust-page';
import { GlobalDocument } from '@/components/visual-editor/global-document';
import type { Locale } from '@/i18n/config';
export function generateMetadata({ params }: { params: { locale: Locale } }) { return trustMetadata(params.locale, 'privacy'); }
export default function Page({ params }: { params: { locale: Locale } }) {
  return <GlobalDocument id="privacy" locale={params.locale}><TrustPage locale={params.locale} kind="privacy" /></GlobalDocument>;
}
