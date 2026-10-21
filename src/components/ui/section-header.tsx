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
    // The title block is allowed to shrink (`min-w-0`) and the "see all" pill
    // drops to its own line on narrow screens — otherwise the heading is
    // squeezed below its longest word and the page overflows horizontally.
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h2
          id={id}
          className="break-words font-display text-[1.75rem] font-semibold leading-tight text-ink-900 sm:text-3xl"
        >
          {title}
        </h2>
        {subtitle && <p className="mt-1.5 break-words text-[15px] text-ink-500">{subtitle}</p>}
      </div>
      {seeAllHref && (
        <Link
          href={seeAllHref}
          className="group flex max-w-full shrink-0 items-center gap-1 self-start rounded-full border border-sunset-200 bg-peach-50 px-3.5 py-1.5 text-[13px] font-semibold text-sunset-700 transition-colors hover:bg-peach-100 hover:text-sunset-800 sm:self-auto"
        >
          <span className="min-w-0 break-words">{seeAllLabel}</span>
          <ArrowRight size={14} className="flip-rtl shrink-0 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}