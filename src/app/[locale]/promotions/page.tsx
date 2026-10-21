import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import PromotionsClient from './promotions-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: '/promotions',
    title: 'title.promotions',
    description: 'description.promotions',
  });
}

export default function Page() {
  return <PromotionsClient />;
}
