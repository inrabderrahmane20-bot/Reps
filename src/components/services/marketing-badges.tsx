'use client';

import { useTranslations } from 'next-intl';
import { promotionBadge, promotionPrices } from '@/lib/marketing';
import type { PromotionInfo } from '@/lib/types';

/** "-20%" style pill shown while a promotion is active. */
export function PromotionBadge({ promo, size = 'sm' }: { promo: PromotionInfo; size?: 'sm' | 'md' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-br from-sunset-500 to-sunset-600 font-bold text-white shadow-sunset ${
        size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]'
      }`}
      title={promo.description}
    >
      {promotionBadge(promo)}
    </span>
  );
}

/**
 * "80 DH → 65 DH" price comparison.
 *
 * The original price is only struck through when it is genuinely higher than
 * the promotional one — the numbers are read through the validated price
 * helper, so an incoherent offer never shows a fake saving.
 */
export function PromoPrice({ promo, className = '' }: { promo: PromotionInfo; className?: string }) {
  const { originalPrice, promotionalPrice } = promo;
  if (!originalPrice && !promotionalPrice) return null;

  const prices = promotionPrices(promo);
  const hasPair = prices.original !== null && prices.current !== null;
  const isRealDiscount = hasPair && prices.original! > prices.current!;

  // No usable numeric pair (e.g. "Sur devis"): show the raw values without
  // any strikethrough so we never suggest a saving we cannot prove.
  if (!hasPair) {
    return (
      <span className={`inline-flex flex-wrap items-center gap-1.5 text-xs font-medium ${className}`}>
        {promotionalPrice && <span className="font-bold text-sunset-700">{promotionalPrice}</span>}
        {promotionalPrice && originalPrice && (
          <span className="text-ink-400">· {originalPrice}</span>
        )}
        {!promotionalPrice && originalPrice && <span className="text-ink-500">{originalPrice}</span>}
      </span>
    );
  }

  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 text-xs font-medium ${className}`}>
      {isRealDiscount && (
        <span className="text-ink-400 line-through decoration-clay-400/70">{originalPrice ?? `${prices.original} DH`}</span>
      )}
      <span className="font-bold text-sunset-700">{promotionalPrice ?? `${prices.current} DH`}</span>
    </span>
  );
}

/**
 * Validity of a promotion — the real end date coming from the offer itself.
 * Never invented: when the date is missing or unparsable nothing is shown.
 */
export function PromoValidity({ promo, className = '' }: { promo: PromotionInfo; className?: string }) {
  const t = useTranslations('home');
  const end = Date.parse(promo.endDate);
  if (Number.isNaN(end)) return null;

  const date = new Date(end);
  const label = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(date);

  return (
    <span className={`inline-flex items-center gap-1 text-[11.5px] font-semibold text-clay-500 ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-clay-400" aria-hidden />
      {t('promoValidUntil', { date: label })}
    </span>
  );
}

/** Small "Sponsorisé" transparency label for paid placements. */
export function SponsoredTag({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const t = useTranslations('common');
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-ink-900/[0.06] font-semibold text-ink-600 ${
        size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[10.5px] uppercase tracking-wide'
      }`}
    >
      {t('sponsored')}
    </span>
  );
}
