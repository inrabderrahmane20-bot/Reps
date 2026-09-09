'use client';

import { useTranslations } from 'next-intl';
import { Users } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export function CommunityCard({
  id,
  name,
  members,
  category,
  joined,
  onJoin,
}: {
  id: string;
  name: string;
  members: number;
  category: string;
  joined: boolean;
  onJoin?: () => void;
}) {
  const t = useTranslations('common');
  const home = useTranslations('home');

  return (
    <article className="card-hover flex flex-col justify-between rounded-2xl border border-ink-900/[0.05] bg-white p-4 shadow-card sm:p-5">
      <Link href={`/communities/${id}`} className="block">
        <div className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-arch bg-zellige-500/10 text-zellige-600">
          <Users size={18} />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-zellige-600">
          {category}
        </span>
        <h3 className="mt-1.5 font-display text-[17px] font-semibold leading-snug text-ink-900">{name}</h3>
        <p className="mt-1 text-xs text-ink-500">
          {members.toLocaleString()} {t('members')}
        </p>
      </Link>
      <button
        type="button"
        onClick={onJoin}
        className={`mt-4 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
          joined
            ? 'bg-sand-100 text-ink-700 hover:bg-sand-200'
            : 'bg-majorelle-600 text-white hover:bg-majorelle-700'
        }`}
      >
        {joined ? t('joined') : home('join')}
      </button>
    </article>
  );
}
