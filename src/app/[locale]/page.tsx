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

export default function Page() {
  return <HomeClient />;
}
