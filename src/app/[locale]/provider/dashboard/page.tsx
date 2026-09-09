'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';

interface RequestRow {
  id: string;
  clientName: string;
  category: string;
  description: string;
  location: string;
  date: string;
  status: string;
  createdAt: string;
}

export default function ProviderDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations('provider');
  const common = useTranslations('common');
  const [requests, setRequests] = useState<RequestRow[]>([]);

  useEffect(() => {
    if (!loading && (!user || user.providerStatus !== 'approved')) {
      router.replace('/profile');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user?.providerStatus === 'approved') {
      api.get<{ requests: RequestRow[] }>('/requests?role=provider').then((r) => setRequests(r.requests));
    }
  }, [user]);

  async function act(id: string, status: string) {
    await api.patch(`/requests/${id}`, { status });
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  if (loading || !user || user.providerStatus !== 'approved') {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-sm text-ink-500">{common('loading')}</div>;
  }

  const today = requests.filter((r) => r.status === 'pending' || r.status === 'accepted');
  const completed = requests.filter((r) => r.status === 'completed');
  const revenue = completed.length; // demo: no real pricing/payment layer yet

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
      <h1 className="font-display text-2xl font-semibold text-ink-900">{t('dashboardTitle')}</h1>
      <p className="mt-1 text-sm text-ink-500">
        {user.provider?.title} · {user.provider?.category}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Requests" value={requests.length} />
        <Stat label="Missions" value={completed.length} />
        <Stat label="Rating" value={requests.length ? '—' : '—'} />
        <Stat label="Availability" value={user.provider?.availability ?? '—'} />
      </div>

      <h2 className="mt-8 font-display text-lg font-semibold text-ink-900">{t('incomingRequests')}</h2>
      {today.length === 0 && completed.length === 0 ? (
        <p className="mt-3 text-sm text-ink-500">{t('noRequests')}</p>
      ) : (
        <div className="mt-3 space-y-2">
          {requests.map((r) => (
            <div key={r.id} className="rounded-2xl bg-white p-4 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-ink-900">{r.clientName}</p>
                  <p className="text-xs text-ink-500">
                    {r.location} · {r.date}
                  </p>
                </div>
                <span className="rounded-full bg-sand-100 px-2.5 py-1 text-xs font-semibold text-ink-700">{r.status}</span>
              </div>
              <p className="mt-2 text-sm text-ink-700">{r.description}</p>
              {r.status === 'pending' && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => act(r.id, 'accepted')} className="rounded-full bg-majorelle-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-majorelle-700">
                    {t('accept')}
                  </button>
                  <button onClick={() => act(r.id, 'refused')} className="rounded-full border border-ink-900/10 px-3.5 py-1.5 text-xs font-semibold text-ink-700 hover:bg-sand-100">
                    {t('refuse')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <p className="text-xs font-semibold text-ink-500">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-ink-900">{value}</p>
    </div>
  );
}
