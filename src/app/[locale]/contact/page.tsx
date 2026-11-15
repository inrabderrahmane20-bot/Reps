import { TrustPage, trustMetadata } from '@/components/trust-page';

export function generateMetadata({ params }: { params: { locale: string } }) {
  return trustMetadata(params.locale, 'contact');
}

export default function Page({ params }: { params: { locale: string } }) {
  return <TrustPage locale={params.locale} kind="contact" />;
}
