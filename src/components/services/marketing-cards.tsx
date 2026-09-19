'use client';

import { useTranslations } from 'next-intl';
import { BadgeCheck, MapPin, Star } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getZone } from '@/lib/zones';
import { AvailabilityBadge } from '@/components/ui/availability-badge';
import { type ServiceListing } from './service-views';
import { PromotionBadge, PromoPrice, SponsoredTag } from './marketing-badges';
import { trackProvider } from '@/lib/track-insight';

function cardImage(item: ServiceListing, promoImage?: string | null) {
  return promoImage || item.portfolio?.[0] || item.avatar || '';
}

function RatingLine({ item }: { item: ServiceListing }) {
  const t = useTranslations('common');
  return (
    <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-ink-700">
      <Star size={13} className="fill-saffron-400 text-saffron-400" aria-hidden />
      {item.rating != null ? item.rating.toFixed(1) : '—'}
      {item.reviewCount > 0 && <span className="font-normal text-ink-400">({item.reviewCount})</span>}
    </span>
  );
}

/**
 * Horizontal sponsored placement card (image-led). Used in the sponsored strip
 * above organic results and in the homepage sponsored carousel.
 */
export function SponsoredCard({
  item,
  onRequest,
  className = '',
}: {
  item: ServiceListing;
  onRequest: (item: ServiceListing) => void;
  className?: string;
}) {
  const t = useTranslations('services');
  const common = useTranslations('common');
  const zoneName = item.zoneId ? getZone(item.zoneId)?.name : undefined;
  const image = cardImage(item, item.promotion?.image);

  return (
    <article className={`card-hover group flex w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-ink-900/[0.06] bg-white shadow-card sm:w-[300px] ${className}`}>
      <Link
        href={`/services/${item.id}`}
        aria-label={item.name}
        onClick={() => trackProvider(item.id, 'clicks')}
        className="relative block aspect-[16/9] w-full overflow-hidden bg-sand-100"
      >
        {image ? (
          <img src={image} alt={item.category} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" loading="lazy" />
        ) : (
          <div className="grid h-full w-full place-items-center font-display text-4xl font-bold text-majorelle-600/30">
            {item.name.charAt(0)}
          </div>
        )}
        <span className="absolute end-2 top-2">
          <SponsoredTag />
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/services/${item.id}`} onClick={() => trackProvider(item.id, 'clicks')} className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-display text-[15.5px] font-semibold text-ink-900 transition-colors group-hover:text-majorelle-700">
              {item.name}
            </h3>
            {item.verified && <BadgeCheck size={15} className="shrink-0 text-zellige-500" aria-label={common('verified')} />}
          </div>
          <p className="mt-0.5 truncate text-[12.5px] font-medium text-ink-500">{item.category}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
            <RatingLine item={item} />
            <AvailabilityBadge status={item.availability} />
            {zoneName && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin size={11} aria-hidden />
                {zoneName}
              </span>
            )}
          </div>
        </Link>
        <button
          type="button"
          onClick={() => {
            trackProvider(item.id, ['clicks', 'requests']);
            onRequest(item);
          }}
          className="mt-3.5 w-full rounded-full bg-majorelle-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-majorelle-700"
        >
          {t('requestService')}
        </button>
      </div>
    </article>
  );
}

/**
 * Promotional offer card: large image, clear discount badge, original → promo
 * price and a "Profiter" call to action. Used on the promotions page and the
 * homepage deals section.
 */
export function PromotionCard({
  item,
  onRequest,
  className = '',
}: {
  item: ServiceListing;
  onRequest: (item: ServiceListing) => void;
  className?: string;
}) {
  const t = useTranslations('services');
  const common = useTranslations('common');
  const promo = item.promotion;
  const zoneName = item.zoneId ? getZone(item.zoneId)?.name : undefined;
  const image = cardImage(item, promo?.image);

  if (!promo) return null;

  return (
    <article className={`group flex flex-col overflow-hidden rounded-[1.4rem] border border-ink-900/[0.06] bg-white shadow-card ${className}`}>
      <Link href={`/services/${item.id}`} aria-label={item.name} className="relative block aspect-[16/9] w-full overflow-hidden bg-sand-100">
        {image ? (
          <img src={image} alt={item.category} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" loading="lazy" />
        ) : (
          <div className="grid h-full w-full place-items-center font-display text-5xl font-bold text-majorelle-600/30">
            {item.name.charAt(0)}
          </div>
        )}
        <span className="absolute start-3 top-3">
          <PromotionBadge promo={promo} size="md" />
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <Link href={`/services/${item.id}`} className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-display text-[16px] font-semibold text-ink-900 transition-colors group-hover:text-majorelle-700">
              {item.name}
            </h3>
            {item.verified && <BadgeCheck size={15} className="shrink-0 text-zellige-500" aria-label={common('verified')} />}
          </div>
          <p className="mt-0.5 truncate text-[12.5px] font-medium text-ink-500">{item.category}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
            <RatingLine item={item} />
            {zoneName && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin size={11} aria-hidden />
                {zoneName}
              </span>
            )}
          </div>
          <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-ink-500">{promo.description}</p>
          <p className="mt-2.5">
            <PromoPrice promo={promo} className="text-[13px]" />
          </p>
        </Link>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => onRequest(item)}
            className="flex-1 rounded-full bg-saffron-500 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-saffron-600"
          >
            {t('takeAdvantage')}
          </button>
          <Link
            href={`/services/${item.id}`}
            aria-label={t('viewProfile')}
            className="inline-flex items-center justify-center rounded-full border border-ink-900/10 px-4 py-2.5 text-xs font-semibold text-ink-700 transition-colors hover:bg-sand-100"
          >
            {t('viewProfile')}
          </Link>
        </div>
      </div>
    </article>
  );
}

/** Loading placeholder matching the sponsored card shape. */
export function SponsoredCardSkeleton() {
  return (
    <div className="w-[260px] shrink-0 snap-start overflow-hidden rounded-2xl border border-ink-900/[0.06] bg-white shadow-card sm:w-[300px]" aria-hidden>
      <div className="aspect-[16/9] w-full animate-pulse bg-sand-200" />
      <div className="space-y-2.5 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-sand-200" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-sand-200" />
        <div className="h-8 w-full animate-pulse rounded-full bg-sand-200" />
      </div>
    </div>
  );
}

/** Loading placeholder matching the promotion card shape. */
export function PromotionCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-ink-900/[0.06] bg-white shadow-card" aria-hidden>
      <div className="aspect-[16/9] w-full animate-pulse bg-sand-200" />
      <div className="space-y-2.5 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-sand-200" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-sand-200" />
        <div className="h-3 w-full animate-pulse rounded-full bg-sand-200" />
        <div className="h-8 w-full animate-pulse rounded-full bg-sand-200" />
      </div>
    </div>
  );
}