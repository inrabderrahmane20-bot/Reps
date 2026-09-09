import { Newspaper } from 'lucide-react';
import { ComingSoon } from '@/components/ui/coming-soon';

export default function NewsPage() {
  return (
    <ComingSoon
      icon={Newspaper}
      title="Local news — coming soon"
      description="We're focused on getting the services marketplace right first. Local news for Marrakech is coming in a future update."
    />
  );
}
