import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import ServicesClient from './services-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: '/services',
    title: 'title.services',
    description: 'description.services',
  });
}

export default function Page() {
  return <ServicesClient />;
}
