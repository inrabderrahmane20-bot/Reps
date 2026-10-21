import type { Metadata } from 'next';
import DiscoverClient from './discover-client';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return buildMetadata({
    locale,
    path: '/discover',
    title: 'title.discover',
    description: 'description.discover',
  });
}

export default function DiscoverPage() {
  return <DiscoverClient />;
}
