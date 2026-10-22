import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { readDb } from '@/lib/db';
import { findParentTop } from '@/lib/service-categories';
import ServiceDetailClient from './service-detail-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const user = readDb().users.find(
    (entry) => entry.id === id && entry.providerStatus === 'approved' && entry.status === 'active'
  );
  const provider = user?.provider;

  if (!user || !provider) {
    const metadata = await buildMetadata({
      locale,
      path: `/services/${id}`,
      title: 'title.services',
      description: 'description.services',
    });
    return { ...metadata, robots: { index: false, follow: true } };
  }

  const name = `${user.firstName} ${user.lastName}`;
  const title = provider.title;
  const description = [title, name, provider.category, provider.description?.trim()]
    .filter(Boolean)
    .join(' ')
    .slice(0, 300);
  const image = provider.portfolio?.[0] || user.avatar || undefined;
  const metadata = await buildMetadata({
    locale,
    path: `/services/${id}`,
    title: `${title} — ${name}`,
    description,
    image,
    type: 'website',
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `${title} — ${name}`,
    description: provider.description?.slice(0, 300),
    areaServed: 'Marrakech',
    category: findParentTop(provider.category) ?? provider.category,
    ...(image ? { image } : {}),
  };

  return { ...metadata, other: { 'script:ld+json': JSON.stringify(jsonLd) } };
}

export default function Page({ params }: { params: { id: string } }) {
  return <ServiceDetailClient params={params} />;
}
