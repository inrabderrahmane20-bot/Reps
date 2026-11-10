'use client';

import { useTranslations } from 'next-intl';
import { Users } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { FavoriteButton } from '@/components/ui/favorite-button';

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
    <article className="card-hover relative flex flex-col justify-between rounded-[22px] border border-line bg-white p-4 shadow-card sm:p-5">
      <div className="absolute end-3 top-3">
        <FavoriteButton type="community" targetId={id} meta={{ title: name }} />
      </div>
      <Link href={`/communities/${id}`} className="block">
        <div className="community-card-icon mb-3.5 flex h-11 w-11 items-center justify-center rounded-arch bg-wine-50 text-wine-700">
          <Users size={18} />
        </div>
        <span className="community-card-category text-[11px] font-semibold uppercase tracking-wide text-wine-700">
          {category}
        </span>
        <h3 className="mt-1.5 break-words font-display text-[17px] font-semibold leading-snug text-ink-900">{name}</h3>
        <p className="mt-1 text-xs text-ink-500">
          {members.toLocaleString()} {t('members')}
        </p>
      </Link>
      <button
        type="button"
        onClick={onJoin}
        className={`community-join mt-4 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
          joined
            ? 'community-join--joined bg-beige text-ink-700 hover:bg-line'
            : 'community-join--idle bg-wine-700 text-white hover:bg-wine-800'
        }`}
      >
        {joined ? t('joined') : home('join')}
      </button>
    </article>
  );
}
