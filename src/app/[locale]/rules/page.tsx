import { BookOpen } from 'lucide-react';
import { ComingSoon } from '@/components/ui/coming-soon';

export default function RulesPage() {
  return (
    <ComingSoon
      icon={BookOpen}
      title="Community rules"
      description="Guidelines every member agrees to when joining Medina."
    />
  );
}
