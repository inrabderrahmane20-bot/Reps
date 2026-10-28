'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Star } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';

type Favorite = {
  id: string;
  userId: string;
  type: string;
  targetId: string;
  meta?: Record<string, any>;
  createdAt: string;
};

type Invitation = {
  id: string;
  senderId: string;
  receiverId: string;
  type: string;
  relatedId?: string | null;
  message?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
};

type SavedSearch = {
  id: string;
  userId: string;
  query: string;
  filters?: Record<string, any>;
  createdAt: string;
};

export default function FavoritesPage() {
  const t = useTranslations('favorites');
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  useEffect(() => {
    if (!user) {
      return;
    }
    async function load() {
      try {
        const [fRes, iRes, sRes] = await Promise.all([
          api.get<{ items: Favorite[] }>('/favorites'),
          api.get<{ items: Invitation[] }>('/invitations?scope=received'),
          api.get<{ items: SavedSearch[] }>('/saved-searches'),
        ]);
        setFavorites(fRes.items || []);
        setInvitations(iRes.items || []);
        setSavedSearches(sRes.items || []);
      } catch (e) {
        // ignore
      }
    }
    load();
  }, [user]);

  const grouped = {
    provider: favorites.filter((f) => f.type === 'provider'),
    listing: favorites.filter((f) => f.type === 'listing' || f.type === 'product'),
    place: favorites.filter((f) => f.type === 'place'),
    activity: favorites.filter((f) => f.type === 'activity' || f.type === 'event'),
    community: favorites.filter((f) => f.type === 'community'),
    news: favorites.filter((f) => f.type === 'news'),
  };

  const sections = [
    { key: 'providers', label: t('providers'), items: grouped.provider },
    { key: 'listings', label: t('listings'), items: grouped.listing },
    { key: 'places', label: t('places'), items: grouped.place },
    { key: 'activities', label: t('activities'), items: grouped.activity },
    { key: 'communities', label: t('communities'), items: grouped.community },
    { key: 'news', label: t('news'), items: grouped.news },
  ];

  if (!user) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-peach-100 text-sunset-600">
            <Star size={18} />
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink-900">{t('title')}</h1>
            <p className="mt-1 text-sm text-ink-500">{t('subtitle')}</p>
          </div>
        </div>
        <div className="mt-8 rounded-2xl border border-ink-900/[0.06] bg-white p-8 text-center shadow-card">
          <p className="text-sm text-ink-600">{t('loginRequired') || 'Please sign in to view your favorites.'}</p>
          <Link href="/auth/login" className="mt-4 inline-flex rounded-full bg-sunset-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sunset-600">
            {t('signIn') || 'Sign in'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-peach-100 text-sunset-600">
          <Star size={18} />
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-900">{t('title')}</h1>
          <p className="mt-1 text-sm text-ink-500">{t('subtitle')}</p>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <section key={section.key} className="overflow-hidden rounded-2xl border border-ink-900/[0.06] bg-white shadow-card">
            <header className="flex items-center justify-between border-b border-ink-900/[0.05] px-5 py-3.5">
              <h2 className="font-display text-lg font-semibold text-ink-900">{section.label}</h2>
              <span className="text-sm text-ink-400">{section.items.length}</span>
            </header>
            {section.items.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-ink-500">{t('emptySection')}</div>
            ) : (
              <ul className="divide-y divide-ink-900/[0.04]">
                {section.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-900">{item.meta?.title || item.targetId}</p>
                      <p className="text-xs text-ink-400">{new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section className="overflow-hidden rounded-2xl border border-ink-900/[0.06] bg-white shadow-card">
          <header className="flex items-center justify-between border-b border-ink-900/[0.05] px-5 py-3.5">
            <h2 className="font-display text-lg font-semibold text-ink-900">{t('invitations')}</h2>
            <span className="text-sm text-ink-400">{invitations.length}</span>
          </header>
          {invitations.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-ink-500">{t('emptySection')}</div>
          ) : (
            <ul className="divide-y divide-ink-900/[0.04]">
              {invitations.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink-900">{inv.type} • {inv.status}</p>
                    {inv.message && <p className="text-xs text-ink-500">{inv.message}</p>}
                  </div>
                  <p className="text-xs text-ink-400">{new Date(inv.createdAt).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-ink-900/[0.06] bg-white shadow-card">
          <header className="flex items-center justify-between border-b border-ink-900/[0.05] px-5 py-3.5">
            <h2 className="font-display text-lg font-semibold text-ink-900">{t('savedSearches')}</h2>
            <span className="text-sm text-ink-400">{savedSearches.length}</span>
          </header>
          {savedSearches.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-ink-500">{t('emptySection')}</div>
          ) : (
            <ul className="divide-y divide-ink-900/[0.04]">
              {savedSearches.map((s) => (
                <li key={s.id} className="flex items-center justify-between px-5 py-3">
                  <p className="text-sm text-ink-900">{s.query}</p>
                  <p className="text-xs text-ink-400">{new Date(s.createdAt).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
