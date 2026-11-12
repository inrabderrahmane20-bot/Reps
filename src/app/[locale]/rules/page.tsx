import { BookOpen } from 'lucide-react';
import { GlobalDocument } from '@/components/visual-editor/global-document';
import type { Locale } from '@/i18n/config';
import { ComingSoon } from '@/components/ui/coming-soon';

export default function RulesPage({ params }: { params: { locale: Locale } }) {
  return (
    <GlobalDocument id="rules" locale={params.locale}><ComingSoon
      icon={BookOpen}
      title="Community rules"
      description="Guidelines every member agrees to when joining Medina."
    /></GlobalDocument>
  );
}
