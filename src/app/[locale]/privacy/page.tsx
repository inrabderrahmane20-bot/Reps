import { ShieldCheck } from 'lucide-react';
import { ComingSoon } from '@/components/ui/coming-soon';

export default function PrivacyPage() {
  return (
    <ComingSoon
      icon={ShieldCheck}
      title="Privacy Policy"
      description="How Medina collects, uses and protects your data will be published here."
    />
  );
}
