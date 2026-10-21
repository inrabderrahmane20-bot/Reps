import type { Metadata } from 'next';
import { CalendarDays } from 'lucide-react';
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
    path: '/activities',
    title: 'title.activities',
    description: 'description.activities',
  });
}

export default function ActivitiesPage() {
  return (
    <ComingSoon
      icon={CalendarDays}
      title="Activities — coming soon"
      description="Group outings and meetups are on the roadmap. Right now we're focused on getting local services right."
    />
  );
}
