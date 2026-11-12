import { GlobalDocument } from '@/components/visual-editor/global-document';
import type { Locale } from '@/i18n/config';
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

export default async function ServicesPage({ params }: { params: { locale: Locale } }) {
  const categories = await getCategoryTree();
  return <GlobalDocument id="services" locale={params.locale} initialCategories={categories}><ServicesClient initialCategories={categories} /></GlobalDocument>;
}
