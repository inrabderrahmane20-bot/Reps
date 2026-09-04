import { useTranslations } from 'next-intl';

export type Availability = 'available' | 'later' | 'offline';

const dotColor: Record<Availability, string> = {
  available: 'bg-zellige-500',
  later: 'bg-saffron-500',
  offline: 'bg-ink-300',
};

export function AvailabilityBadge({ status }: { status: Availability }) {
  const t = useTranslations('common');
  const label = { available: t('available'), later: t('availableLater'), offline: t('offline') }[
    status
  ];

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-700">
      <span className={`h-2 w-2 rounded-full ${dotColor[status]}`} aria-hidden />
      {label}
    </span>
  );
}
