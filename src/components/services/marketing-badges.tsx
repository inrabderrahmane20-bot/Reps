'use client';

import { useTranslations } from 'next-intl';
import { promotionBadge } from '@/lib/marketing';
import type { PromotionInfo } from '@/lib/types';

/** -20% style pill shown while a promotion is active. */
export function PromotionBadge({ promo, size = 'sm' }: { promo: PromotionInfo; size?: 'sm' | 'md' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full bg-saffron-500 font-bold text-white ${
        size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]'
      }`}
      title={promo.description}
    >
      {promotionBadge(promo)}
    </span>
  );
}

/**
 * "80 DH → 65 DH" price comparison. Renders nothing when no promotional price
 * has been set.
 */
export function PromoPrice({ promo, className = '' }: { promo: PromotionInfo; className?: string }) {
  const { originalPrice, promotionalPrice } = promo;
  if (!originalPrice && !promotionalPrice) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${className}`}>
      {originalPrice && <span className="text-ink-400 line-through decoration-clay-400/70">{originalPrice}</span>}
      {promotionalPrice && <span className="font-bold text-saffron-700">{promotionalPrice}</span>}
    </span>
  );
}

/** Small "Sponsorisé" transparency label for paid placements. */
export function SponsoredTag({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const t = useTranslations('common');
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-majorelle-600/10 font-semibold text-majorelle-700 ${
        size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[10.5px] uppercase tracking-wide'
      }`}
    >
      {t('sponsored')}
    </span>
  );
}