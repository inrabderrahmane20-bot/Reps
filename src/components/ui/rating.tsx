import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function Rating({ value, count }: { value: number; count?: number }) {
  const t = useTranslations('common');
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-700">
      <Star size={13} className="fill-saffron-500 text-saffron-500" />
      {value.toFixed(1)}
      {typeof count === 'number' && (
        <span className="text-ink-300">
          ({count} {t('reviews')})
        </span>
      )}
    </span>
  );
}
