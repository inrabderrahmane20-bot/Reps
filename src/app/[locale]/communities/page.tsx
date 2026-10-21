import type { Metadata } from 'next';
import CommunitiesClient from './communities-client';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return buildMetadata({
    locale,
    path: '/communities',
    title: 'title.communities',
    description: 'description.communities',
  });
}

export default function CommunitiesPage() {
  return <CommunitiesClient />;
}
