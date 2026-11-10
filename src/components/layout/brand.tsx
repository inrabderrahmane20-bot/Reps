'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/** Shared Annabid wordmark used by both navbar layouts and the mobile drawer. */
export function Brand({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  const t = useTranslations('nav');
  return (
    <Link
      href="/"
      className={`flex shrink-0 items-center gap-1 rounded-full border border-line bg-white/90 px-2 py-1 shadow-sm backdrop-blur ${className}`}
      aria-label={t('brandHome')}
    >
      <BrandMark className="annabid-logo h-8 w-16 shrink-0" />
      {!compact && (
        <span className="annabid-wordmark flex flex-col items-center whitespace-nowrap leading-none text-[#e30e1b]">
          <span className="annabid-wordmark-latin font-display text-[17px] font-extrabold tracking-[-0.025em]">Annabid</span>
          <span lang="ar" dir="rtl" className="annabid-wordmark-arabic mt-0.5 font-arabic text-[12px] font-bold">
            النابض
          </span>
        </span>
      )}
    </Link>
  );
}

export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1500 750" aria-hidden="true">
      <path
        className="annabid-signal annabid-signal-left"
        pathLength="1"
        d="M55 433 H268 L305 350 L337 555 L397 290 L428 610 L470 385 L497 435 H640"
      />
      <path
        className="annabid-signal annabid-signal-right"
        pathLength="1"
        d="M880 435 H1023 L1050 385 L1092 610 L1123 290 L1183 555 L1215 350 L1255 433 H1465"
      />
      <g className="annabid-heart-wrap">
        <path
          className="annabid-heart-glow"
          d="M760 650 C700 595 510 450 510 355 C510 280 575 237 640 237 C700 237 740 268 760 290 C780 268 820 237 880 237 C945 237 1010 280 1010 355 C1010 450 820 595 760 650Z"
        />
        <path
          className="annabid-heart"
          d="M760 652 C700 595 510 450 510 355 C510 280 575 237 640 237 C700 237 740 268 760 290 C780 268 820 237 880 237 C945 237 1010 280 1010 355 C1010 450 820 595 760 652Z"
        />
        <g className="annabid-inner">
          <path d="M690 420 V390 H710 V403" />
          <path d="M712 397 L763 357 L853 420" />
          <path d="M763 502 L714 458 C690 432 715 406 740 410 C752 412 759 420 763 428 C767 420 774 412 786 410 C811 406 836 432 812 458 Z" />
          <path d="M598 453 H648 L658 436 L665 480 L677 425 L686 492 L695 440 L701 456 H714" />
          <path d="M928 453 H878 L868 436 L861 480 L849 425 L840 492 L831 440 L825 456 H812" />
        </g>
      </g>
    </svg>
  );
}
