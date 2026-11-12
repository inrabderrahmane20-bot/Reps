import { FileText } from 'lucide-react';
import { GlobalDocument } from '@/components/visual-editor/global-document';
import type { Locale } from '@/i18n/config';
import { ComingSoon } from '@/components/ui/coming-soon';

export default function TermsPage({ params }: { params: { locale: Locale } }) {
  return (
    <GlobalDocument id="terms" locale={params.locale}><ComingSoon
      icon={FileText}
      title="Terms of Service"
      description="Full legal terms will be published here before launch."
    /></GlobalDocument>
  );
}
