'use client';

import { useTranslations } from 'next-intl';
import { CalendarDays, MapPin } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export function ActivityCard({
  id,
  title,
  category,
  date,
  location,
  participants,
  max,
  joined,
  onJoin,
}: {
  id: string;
  title: string;
  category: string;
  date: string;
  location: string;
  participants: number;
  max: number;
  joined?: boolean;
  onJoin?: () => void;
}) {
  const t = useTranslations('common');
  const home = useTranslations('home');
  const spotsLeft = max - participants;
  const full = spotsLeft <= 0 && !joined;

  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card">
      <Link href={`/activities/${id}`} className="flex flex-1 flex-col gap-3">
        <span className="w-fit rounded-full bg-clay-400/10 px-2.5 py-1 text-[11px] font-semibold text-clay-500">
          {category}
        </span>
        <h3 className="font-display text-base font-semibold text-ink-900">{title}</h3>
        <div className="flex flex-col gap-1.5 text-xs text-ink-500">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={13} /> {date}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={13} /> {location}
          </span>
        </div>
      </Link>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs font-medium text-ink-700">
          {participants}/{max} · {Math.max(spotsLeft, 0)} {t('spotsLeft')}
        </span>
        <button
          type="button"
          disabled={full}
          onClick={onJoin}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold text-white transition-colors ${
            full ? 'cursor-not-allowed bg-ink-300' : joined ? 'bg-ink-700 hover:bg-ink-900' : 'bg-majorelle-600 hover:bg-majorelle-700'
          }`}
        >
          {full ? t('full') : joined ? t('leave') : home('join')}
        </button>
      </div>
    </article>
  );
}
