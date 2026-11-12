import { ShieldCheck } from 'lucide-react';
import { GlobalDocument } from '@/components/visual-editor/global-document';
import type { Locale } from '@/i18n/config';
import { ComingSoon } from '@/components/ui/coming-soon';

export default function PrivacyPage({ params }: { params: { locale: Locale } }) {
  return (
    <GlobalDocument id="privacy" locale={params.locale}><ComingSoon
      icon={ShieldCheck}
      title="Privacy Policy"
      description="How Medina collects, uses and protects your data will be published here."
    /></GlobalDocument>
  );
}
