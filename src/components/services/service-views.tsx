'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { BadgeCheck, List, LayoutGrid, MapPin, Rows3 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Rating } from '@/components/ui/rating';
import { AvailabilityBadge, type Availability } from '@/components/ui/availability-badge';
import { getZone } from '@/lib/zones';
import type { PromotionInfo } from '@/lib/types';
import { PromotionBadge, PromoPrice, SponsoredTag } from './marketing-badges';

/** Enriched provider row as displayed across all service view modes. */
export interface ServiceListing {
  id: string;
  name: string;
  category: string;
  title: string;
  rating: number | null;
  reviewCount: number;
  availability: Availability;
  distanceKm: number | null;
  verified: boolean;
  avatar: string;
  description?: string;
  priceRange?: string;
  portfolio?: string[];
  zoneId?: string;
  /** True while the sponsorship window is active (server-computed). */
  sponsored?: boolean;
  /** The promotion while it is active; null otherwise (server-computed). */
  promotion?: PromotionInfo | null;
}

export type ViewMode = 'list' | 'grid' | 'large';

const VIEW_MODES: { mode: ViewMode; icon: typeof List; labelKey: 'viewList' | 'viewGrid' | 'viewLarge' }[] = [
  { mode: 'list', icon: List, labelKey: 'viewList' },
  { mode: 'grid', icon: LayoutGrid, labelKey: 'viewGrid' },
  { mode: 'large', icon: Rows3, labelKey: 'viewLarge' },
];

export function ViewSwitcher({
  value,
  onChange,
  allowLarge = false,
  className = '',
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  allowLarge?: boolean;
  className?: string;
}) {
  const t = useTranslations('services');
  const modes = VIEW_MODES.filter((m) => allowLarge || m.mode !== 'large');

  return (
    <div
      role="group"
      aria-label={t('viewMode')}
      className={`inline-flex items-center gap-0.5 rounded-full border border-ink-900/10 bg-white p-0.5 ${className}`}
    >
      {modes.map(({ mode, icon: Icon, labelKey }) => {
        const active = value === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            aria-pressed={active}
            aria-label={t(labelKey)}
            title={t(labelKey)}
            className={`grid h-8 w-9 place-items-center rounded-full transition-colors ${
              active ? 'bg-majorelle-600 text-white shadow-sm' : 'text-ink-500 hover:bg-sand-100 hover:text-ink-900'
            }`}
          >
            <Icon size={16} strokeWidth={active ? 2.4 : 2} />
          </button>
        );
      })}
    </div>
  );
}

/** Compact, information-dense row — the default directory mode. */
export function ServiceListRow({
  item,
  onRequest,
}: {
  item: ServiceListing;
  onRequest: (item: ServiceListing) => void;
}) {
  const t = useTranslations('services');
  const common = useTranslations('common');
  const zoneName = item.zoneId ? getZone(item.zoneId)?.name : undefined;
  return (
    <article className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-white sm:gap-4 sm:px-4">
      <Link href={`/services/${item.id}`} className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <ProviderAvatar item={item} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <h3 className="truncate font-display text-[15px] font-semibold text-ink-900 transition-colors group-hover:text-majorelle-700">
              {item.name}
            </h3>
            {item.verified && <BadgeCheck size={15} className="shrink-0 text-zellige-500" aria-label={common('verified')} />}
            {item.sponsored && <SponsoredTag />}
            {item.promotion && <PromotionBadge promo={item.promotion} />}
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] leading-snug text-ink-500">
            <span className="truncate font-medium text-ink-700">{item.category}</span>
            {zoneName && (
              <>
                <span className="text-ink-300" aria-hidden>
                  ·
                </span>
                <span className="inline-flex items-center gap-0.5">
                  <MapPin size={11} className="text-ink-400" aria-hidden />
                  {zoneName}
                </span>
              </>
            )}
            <span className="hidden text-ink-300 sm:inline" aria-hidden>
              ·
            </span>
            <span className="hidden sm:inline">
              <Rating value={item.rating ?? 0} count={item.reviewCount} />
            </span>
            <span className="hidden text-ink-300 sm:inline" aria-hidden>
              ·
            </span>
            <span className="hidden sm:inline">
              <AvailabilityBadge status={item.availability} />
            </span>
          </p>
          {item.promotion?.promotionalPrice && (
            <p className="mt-0.5 sm:hidden">
              <PromoPrice promo={item.promotion} />
            </p>
          )}
        </div>
        {/* Mobile: keep rating + availability visible without shrinking the row */}
        <div className="flex shrink-0 flex-col items-end gap-1 sm:hidden">
          <Rating value={item.rating ?? 0} count={item.reviewCount} />
          <AvailabilityBadge status={item.availability} />
        </div>
      </Link>

      {item.distanceKm != null && (
        <span className="hidden shrink-0 items-center gap-1 text-xs text-ink-500 xl:flex">
          <MapPin size={12} />
          {item.distanceKm.toFixed(1)} {common('away')}
        </span>
      )}

      {item.promotion && (
        <span className="hidden md:inline-flex">
          <PromoPrice promo={item.promotion} />
        </span>
      )}

      <button
        type="button"
        onClick={() => onRequest(item)}
        className="shrink-0 rounded-full bg-majorelle-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-majorelle-700 sm:px-4"
      >
        {t('requestShort')}
      </button>
    </article>
  );
}

/** Medium grid card, consistent with the rest of the Medina card language. */
export function ServiceGridCard({
  item,
  onRequest,
}: {
  item: ServiceListing;
  onRequest: (item: ServiceListing) => void;
}) {
  const t = useTranslations('services');
  const common = useTranslations('common');
  const zoneName = item.zoneId ? getZone(item.zoneId)?.name : undefined;
  return (
    <article className="card-hover group relative flex flex-col rounded-2xl border border-ink-900/[0.06] bg-white p-4 shadow-card sm:p-5">
      {item.sponsored && (
        <span className="absolute end-3 top-3 z-10">
          <SponsoredTag />
        </span>
      )}
      <Link href={`/services/${item.id}`} className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3">
          <ProviderAvatar item={item} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="truncate font-display text-[16px] font-semibold text-ink-900 transition-colors group-hover:text-majorelle-700">
                {item.name}
              </h3>
              {item.verified && <BadgeCheck size={15} className="shrink-0 text-zellige-500" aria-label={common('verified')} />}
            </div>
            <p className="mt-0.5 truncate text-[13px] text-ink-500">{item.category}</p>
            {zoneName && (
              <p className="mt-0.5 inline-flex items-center gap-0.5 text-xs text-ink-400">
                <MapPin size={11} aria-hidden />
                {zoneName}
              </p>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Rating value={item.rating ?? 0} count={item.reviewCount} />
          <AvailabilityBadge status={item.availability} />
          {item.distanceKm != null && (
            <span className="inline-flex items-center gap-1 text-xs text-ink-500">
              <MapPin size={12} />
              {item.distanceKm.toFixed(1)} {common('away')}
            </span>
          )}
          {item.promotion && <PromotionBadge promo={item.promotion} />}
        </div>
        {item.promotion && (
          <p className="mt-2 flex flex-wrap items-center gap-2">
            <PromoPrice promo={item.promotion} />
            <span className="text-[11px] text-ink-400">{item.promotion.description}</span>
          </p>
        )}
      </Link>
      <button
        type="button"
        onClick={() => onRequest(item)}
        className="mt-3.5 w-full rounded-full bg-majorelle-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-majorelle-700"
      >
        {t('requestService')}
      </button>
    </article>
  );
}

/** Large visual mode: big photo, full summary, two prominent actions. */
export function ServiceLargeCard({
  item,
  onRequest,
}: {
  item: ServiceListing;
  onRequest: (item: ServiceListing) => void;
}) {
  const t = useTranslations('services');
  const common = useTranslations('common');
  const media = item.portfolio?.[0] ?? item.avatar;

  return (
    <article className="card-hover group overflow-hidden rounded-[1.75rem] border border-ink-900/[0.06] bg-white shadow-card">
      <Link href={`/services/${item.id}`} className="block">
        <div className="relative aspect-[16/7] w-full overflow-hidden bg-sand-100 sm:aspect-[16/5]">
          {media ? (
            <Image
              src={media}
              alt={item.category}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              sizes="(min-width: 1024px) 60vw, 100vw"
            />
          ) : (
            <div className="grid h-full w-full place-items-center">
              <ProviderAvatar item={item} size="xl" />
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center">
        <Link href={`/services/${item.id}`} className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-display text-xl font-semibold text-ink-900 transition-colors hover:text-majorelle-700">
              {item.name}
            </h3>
            {item.verified && <BadgeCheck size={17} className="shrink-0 text-zellige-500" aria-label={common('verified')} />}
          </div>
          <p className="mt-0.5 text-sm font-medium text-ink-700">{item.category}</p>
          <p className="mt-0.5 text-[13px] text-ink-500">{item.title}</p>
          {item.description && (
            <p className="mt-2 hidden max-w-2xl text-sm leading-relaxed text-ink-700 sm:line-clamp-2">{item.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <Rating value={item.rating ?? 0} count={item.reviewCount} />
            <AvailabilityBadge status={item.availability} />
            {item.distanceKm != null && (
              <span className="inline-flex items-center gap-1 text-xs text-ink-500">
                <MapPin size={12} />
                {item.distanceKm.toFixed(1)} {common('away')}
              </span>
            )}
          </div>
        </Link>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
          <button
            type="button"
            onClick={() => onRequest(item)}
            className="rounded-full bg-majorelle-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-majorelle-700"
          >
            {t('requestService')}
          </button>
          <Link
            href={`/services/${item.id}`}
            className="rounded-full border border-ink-900/10 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-sand-100"
          >
            {t('viewProfile')}
          </Link>
        </div>
      </div>
    </article>
  );
}

function ProviderAvatar({ item, size }: { item: ServiceListing; size: 'md' | 'lg' | 'xl' }) {
  const sizes = {
    md: 'h-11 w-11',
    lg: 'h-14 w-14',
    xl: 'h-24 w-24',
  }[size];
  const fontSizes = { md: 'text-base', lg: 'text-lg', xl: 'text-3xl' }[size];

  if (item.avatar) {
    return <img src={item.avatar} alt="" className={`${sizes} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <span className={`${sizes} grid shrink-0 place-items-center rounded-full bg-majorelle-600/10 font-display font-semibold text-majorelle-700 ${fontSizes}`}>
      {item.name.charAt(0)}
    </span>
  );
}