import { MessageCircle } from 'lucide-react';
import { ComingSoon } from '@/components/ui/coming-soon';

export default function MessagesPage() {
  return (
    <ComingSoon
      icon={MessageCircle}
      title="Messages"
      description="Your conversations with providers, activity participants and community members will live here."
    />
  );
}
