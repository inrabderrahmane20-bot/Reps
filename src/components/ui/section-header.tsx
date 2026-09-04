import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';

export function SectionHeader({
  title,
  subtitle,
  seeAllHref,
  seeAllLabel,
}: {
  title: string;
  subtitle?: string;
  seeAllHref?: string;
  seeAllLabel?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {seeAllHref && (
        <Link
          href={seeAllHref}
          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-majorelle-700 hover:text-majorelle-800"
        >
          {seeAllLabel}
          <ArrowRight size={15} className="flip-rtl" />
        </Link>
      )}
    </div>
  );
}
