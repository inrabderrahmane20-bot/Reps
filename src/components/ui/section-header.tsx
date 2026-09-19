import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';

export function SectionHeader({
  id,
  title,
  subtitle,
  seeAllHref,
  seeAllLabel,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  seeAllHref?: string;
  seeAllLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 id={id} className="font-display text-[1.75rem] font-semibold leading-tight text-ink-900 sm:text-3xl">
          {title}
        </h2>
        {subtitle && <p className="mt-1.5 text-[15px] text-ink-500">{subtitle}</p>}
      </div>
      {seeAllHref && (
        <Link
          href={seeAllHref}
          className="group flex shrink-0 items-center gap-1 text-sm font-semibold text-majorelle-700 hover:text-majorelle-800"
        >
          {seeAllLabel}
          <ArrowRight size={15} className="flip-rtl transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}