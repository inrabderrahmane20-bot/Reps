import { Heart } from 'lucide-react';
import { ComingSoon } from '@/components/ui/coming-soon';

export default function MeetingsPage() {
  return (
    <ComingSoon
      icon={Heart}
      title="Meetings — coming soon"
      description="Thoughtful introductions for serious relationships and marriage are on the roadmap. Right now we're focused on getting local services right."
    />
  );
}
