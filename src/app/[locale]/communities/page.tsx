'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CommunityCard } from '@/components/cards/community-card';
import { CreateCommunityModal } from '@/components/communities/create-community-modal';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';

interface CommunityRow {
  id: string;
  name: string;
  category: string;
  memberCount: number;
  memberIds: string[];
}

export default function CommunitiesPage() {
  const t = useTranslations('communities');
  const { user } = useAuth();
  const [communities, setCommunities] = useState<CommunityRow[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  function load() {
    api.get<{ communities: CommunityRow[] }>('/communities').then((r) => setCommunities(r.communities));
  }

  useEffect(load, []);

  async function toggleJoin(id: string) {
    if (!user) return (window.location.href = '/login');
    const res = await api.post<{ joined: boolean; memberCount: number }>(`/communities/${id}/join`);
    setCommunities((cs) => cs.map((c) => (c.id === id ? { ...c, memberCount: res.memberCount, memberIds: res.joined ? [...c.memberIds, user.id] : c.memberIds.filter((m) => m !== user.id) } : c)));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[2.1rem] font-semibold leading-tight text-ink-900 sm:text-4xl">{t('title')}</h1>
          <p className="mt-1.5 max-w-xl text-sm text-ink-500">{t('subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => (user ? setShowCreate(true) : (window.location.href = '/login'))}
          className="rounded-full bg-majorelle-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-majorelle-700"
        >
          {t('createGroup')}
        </button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {communities.map((c) => (
          <CommunityCard
            key={c.id}
            id={c.id}
            name={c.name}
            members={c.memberCount}
            category={c.category}
            joined={!!user && c.memberIds.includes(user.id)}
            onJoin={() => toggleJoin(c.id)}
          />
        ))}
      </div>

      {showCreate && (
        <CreateCommunityModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
    </div>
  );
}
