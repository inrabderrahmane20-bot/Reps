import { useTranslations } from 'next-intl';
import { Users2 } from 'lucide-react';

export function RoomCard({
  name,
  topic,
  online,
}: {
  name: string;
  topic: string;
  online: number;
}) {
  const t = useTranslations('meetings');

  return (
    <article className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-card">
      <div className="min-w-0">
        <h3 className="truncate font-display text-base font-semibold text-ink-900">{name}</h3>
        <p className="mt-0.5 truncate text-xs text-ink-500">{topic}</p>
        <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-zellige-600">
          <Users2 size={13} />
          {online} {t('peopleOnline')}
        </span>
      </div>
      <button
        type="button"
        className="shrink-0 rounded-full bg-majorelle-600 px-4 py-2 text-xs font-semibold text-white hover:bg-majorelle-700"
      >
        {t('joinRoom')}
      </button>
    </article>
  );
}
