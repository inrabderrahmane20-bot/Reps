'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ActivityCard } from '@/components/cards/activity-card';
import { CreateActivityModal } from '@/components/activities/create-activity-modal';
import { useAuth } from '@/context/auth-context';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api-client';
import type { Activity } from '@/lib/types';

export default function ActivitiesPage() {
  const t = useTranslations('activities');
  const common = useTranslations('common');
  const search = useTranslations('search');
  const labels = useTranslations('auth');
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<(Activity & { participants: number })[]>([]);
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(false);
    api.get<{ activities: (Activity & { participants: number })[] }>('/activities')
      .then(data => { if (active) setItems(data.activities); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);
  async function join(id: string) {
    if (!user) return router.push('/login');
    try { await api.post('/activities/' + id + '/join'); setRevision(value => value + 1); }
    catch { setError(true); }
  }
  const filtered = items.filter(item => (!city || item.city === city) && (!category || item.category === category));
  return <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
    <h1 className="font-display text-3xl font-semibold">{t('title')}</h1>
    <p className="mt-2 text-ink-700">{t('subtitle')}</p>
    <button className="mt-4 rounded-full bg-majorelle-600 px-5 py-2 text-white" onClick={() => user ? setCreating(true) : router.push('/login')}>{t('create')}</button>
    <div className="mt-6 flex flex-wrap gap-3">
      <label>{labels('cityLabel')} <select className="rounded border p-2" value={city} onChange={event => setCity(event.target.value)}>
        <option value="">{labels('cityLabel')}</option>{[...new Set(items.map(item => item.city))].map(value => <option key={value}>{value}</option>)}
      </select></label>
      <label>{t('title')} <select className="rounded border p-2" aria-label={t('title')} value={category} onChange={event => setCategory(event.target.value)}>
        <option value="">{t('title')}</option>{[...new Set(items.map(item => item.category))].map(value => <option key={value}>{value}</option>)}
      </select></label>
      {(city || category) && <button onClick={() => { setCity(''); setCategory(''); }} className="underline">{common('cancel')}</button>}
    </div>
    {error && <p role="alert" className="mt-5">{common('somethingWentWrong')} <button className="underline" onClick={() => setRevision(value => value + 1)}>{common('tryAgain')}</button></p>}
    {loading ? <p role="status" className="mt-8">{common('loading')}</p> : !error && !filtered.length && <p role="status" className="mt-8">{search('noResults')}</p>}
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(item => <ActivityCard key={item.id} {...item} joined={!!user && item.participantIds.includes(user.id)} onJoin={() => void join(item.id)} />)}</div>
    {creating && <CreateActivityModal onClose={() => setCreating(false)} onCreated={() => { setCreating(false); setRevision(value => value + 1); }} />}
  </div>;
}
