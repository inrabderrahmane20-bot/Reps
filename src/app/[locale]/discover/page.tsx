import { Compass } from 'lucide-react';
import { ComingSoon } from '@/components/ui/coming-soon';

export default function DiscoverPage() {
  return (
    <ComingSoon
      icon={Compass}
      title="Discover"
      description="A single place to browse services, news, communities, activities and meetings when you're not sure what you're looking for."
    />
  );
}
