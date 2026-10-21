import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { readDb } from '@/lib/db';
import { findParentTop } from '@/lib/service-categories';
import ServiceDetailClient from './service-detail-client';

/**
 * SEO metadata for a single service page. Only public (approved + active)
 * providers are described; anything else falls back to the directory copy and
 * is marked `noindex` so unpublished profiles never appear in search engines.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;

  const db = readDb();
  const user = db.users.find(
    (u) => u.id === id && u.providerStatus === 'approved' && u.status === 'active' && u.provider
  );

  if (!user) {
    const meta = await buildMetadata({
      locale,
      path: `/services/${id}`,
      title: 'title.services',
      description: 'description.services',
    });
    return { ...meta, robots: { index: false, follow: true } };
  }

  const name = `${user.firstName} ${user.lastName}`;
  const title = user.provider!.title;
  const family = findParentTop(user.provider!.category);
  const description = [
    `${title} — ${name}, ${user.provider!.category} à Marrakech.`,
    user.provider!.description?.trim(),
  ]
    .filter(Boolean)
    .join(' ');

  const meta = await buildMetadata({
    locale,
    path: `/services/${id}`,
    title: `${title} — ${name}`,
    description: description.slice(0, 300),
    image: user.provider!.portfolio?.[0] || user.avatar || undefined,
    type: 'website',
  });

  // Structured data restricted to what the record genuinely proves: a local
  // business with a name. No invented ratings, prices or review counts.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `${title} — ${name}`,
    description: user.provider!.description?.slice(0, 300),
    areaServed: 'Marrakech',
    category: family ?? user.provider!.category,
    ...(user.provider!.portfolio?.[0] || user.avatar
      ? { image: user.provider!.portfolio?.[0] || user.avatar }
      : {}),
  };

  return { ...meta, other: { 'script:ld+json': JSON.stringify(jsonLd) } };
}

export default function Page({ params }: { params: { id: string } }) {
  return <ServiceDetailClient params={params} />;
}
