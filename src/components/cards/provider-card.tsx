import { useTranslations } from 'next-intl';
import { BadgeCheck } from 'lucide-react';
import { Rating } from '@/components/ui/rating';
import { AvailabilityBadge, type Availability } from '@/components/ui/availability-badge';
import { Link } from '@/i18n/navigation';

export function ProviderCard({
  id,
  name,
  category,
  rating,
  reviews,
  distanceKm,
  availability,
  verified,
}: {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  distanceKm: number;
  availability: Availability;
  verified: boolean;
}) {
  const t = useTranslations('common');
  const services = useTranslations('services');

  return (
    <article className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-card">
      <Link href={`/services/${id}`} className="flex min-w-0 flex-1 items-center gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-majorelle-600/10 font-display text-lg font-semibold text-majorelle-700">
          {name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-display text-base font-semibold text-ink-900">{name}</h3>
            {verified && <BadgeCheck size={16} className="shrink-0 text-zellige-500" aria-label={t('verified')} />}
          </div>
          <p className="text-xs text-ink-500">{category}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <Rating value={rating} count={reviews} />
            <AvailabilityBadge status={availability} />
            <span className="text-xs text-ink-500">
              {distanceKm} {t('away')}
            </span>
          </div>
        </div>
      </Link>
      <Link
        href={`/services/${id}`}
        className="hidden shrink-0 rounded-full bg-majorelle-600 px-4 py-2 text-xs font-semibold text-white hover:bg-majorelle-700 sm:block"
      >
        {services('requestService')}
      </Link>
    </article>
  );
}
