import { CalendarDays } from 'lucide-react';
import { ComingSoon } from '@/components/ui/coming-soon';

export default function ActivityDetailPage() {
  return (
    <ComingSoon
      icon={CalendarDays}
      title="Activities — coming soon"
      description="Group outings and meetups are on the roadmap. Right now we're focused on getting local services right."
    />
  );
}
