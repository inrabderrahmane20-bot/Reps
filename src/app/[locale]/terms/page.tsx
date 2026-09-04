import { FileText } from 'lucide-react';
import { ComingSoon } from '@/components/ui/coming-soon';

export default function TermsPage() {
  return (
    <ComingSoon
      icon={FileText}
      title="Terms of Service"
      description="Full legal terms will be published here before launch."
    />
  );
}
