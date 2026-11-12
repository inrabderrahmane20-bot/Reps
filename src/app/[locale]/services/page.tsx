import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import ServicesClient from './services-client';
import { getCategoryTree } from '@/lib/category-store';

export const dynamic = 'force-dynamic';

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

export default async function ServicesPage() {
  const categories = await getCategoryTree();
  return <ServicesClient initialCategories={categories} />;
}
