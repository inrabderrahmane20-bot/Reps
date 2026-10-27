'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ActivityCard } from '@/components/cards/activity-card';
import { activities as mockActivities } from '@/data/mock';
import { api } from '@/lib/api-client';

export default function ActivitiesPage() {
  const t = useTranslations('activities');
  const [items, setItems] = useState<any[]>([]);
  const [city, setCity] = useState<string>('');
  const [category, setCategory] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get<{ activities: any[] }>('/activities');
        if (!cancelled) setItems(res.activities && res.activities.length ? res.activities : mockActivities);
      } catch {
        if (!cancelled) setItems(mockActivities as any[]);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = items.filter((a) => {
    let ok = true;
    if (city && city !== '') {
      const aCity = (a.city || a.location || '').toString().toLowerCase();
      const c = city.toLowerCase();
      const cityOk =
        aCity.includes(c) ||
        c.includes(aCity) ||
        aCity === c ||
        (c === 'marrakech' && !aCity) ||
        c === 'marrakech';
      if (!cityOk) ok = false;
    }
    if (ok && category && category !== '') {
      const ac = (a.category || '').toString().toLowerCase();
      const cc = category.toLowerCase();
      const catOk = ac === cc || ac.includes(cc);
      if (!catOk) ok = false;
    }
    return ok;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-900">{t('title')}</h1>
          <p className="mt-1.5 max-w-xl text-sm text-ink-500">{t('subtitle')}</p>
        </div>
        <button
          type="button"
          className="rounded-full bg-sunset-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sunset-600"
        >
          {t('create')}
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <select className="rounded-full border border-ink-900/10 bg-white px-3 py-2 text-sm" value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">Ville</option>
          <option value="Marrakech">Marrakech</option>
          <option value="Casablanca">Casablanca</option>
          <option value="Rabat">Rabat</option>
          <option value="Fès">Fès</option>
          <option value="Agadir">Agadir</option>
        </select>
        <select className="rounded-full border border-ink-900/10 bg-white px-3 py-2 text-sm">
          <option>Date</option>
          <option>À venir</option>
          <option>Cette semaine</option>
        </select>
        <select className="rounded-full border border-ink-900/10 bg-white px-3 py-2 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Catégorie</option>
          <option value="Sport">Sport</option>
          <option value="Culture">Culture</option>
          <option value="Sortie">Sortie</option>
          <option value="Swimming">Swimming</option>
          <option value="Running">Running</option>
          <option value="Football">Football</option>
          <option value="Yoga">Yoga</option>
        </select>
        <select className="rounded-full border border-ink-900/10 bg-white px-3 py-2 text-sm">
          <option>Prix</option>
          <option>Gratuit</option>
          <option>Payant</option>
        </select>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((a, i) => (
          <ActivityCard key={`${a.id}-${i}`} {...a} participants={a.participants || a.participantIds?.length || 0} max={a.max || 10} />
        ))}
      </div>
    </div>
  );
}
