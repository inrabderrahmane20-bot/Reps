import { GlobalDocument } from '@/components/visual-editor/global-document';
import type { Locale } from '@/i18n/config';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import HomeClient from './home-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: '/',
    title: 'title.home',
    description: 'description.home',
    includeSiteName: false,
  });
}

export default function Page({ params }: { params: { locale: Locale } }) {
  return <GlobalDocument id="home" locale={params.locale}><HomeClient /></GlobalDocument>;
}
