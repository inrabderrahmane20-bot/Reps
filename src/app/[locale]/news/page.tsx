import type { Metadata } from 'next';
import { Newspaper } from 'lucide-react';
import { ComingSoon } from '@/components/ui/coming-soon';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return buildMetadata({
    locale,
    path: '/news',
    title: 'title.news',
    description: 'description.news',
  });
}

export default function NewsPage() {
  return (
    <ComingSoon
      icon={Newspaper}
      title="Local news — coming soon"
      description="We're focused on getting the services marketplace right first. Local news for Marrakech is coming in a future update."
    />
  );
}
