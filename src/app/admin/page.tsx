'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, apiErrorMessage } from '@/lib/api-client';
import { AdminErrorBanner, AdminLoading } from './admin-feedback';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get<Record<string, number>>('/admin/stats')
      .then(setStats)
      .catch((loadError) =>
        setError(apiErrorMessage(loadError, 'The dashboard could not be loaded.'))
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !stats) return <AdminLoading label="Loading dashboard…" />;
  if (!stats) {
    return (
      <AdminErrorBanner
        message={error ?? 'The dashboard could not be loaded.'}
        onRetry={load}
      />
    );
  }

  const cards: [string, number][] = [
    ['Total users', stats.totalUsers],
    ['Active users', stats.activeUsers],
    ['Providers', stats.providers],
    ['Verified providers', stats.verifiedProviders],
    ['Pending verification', stats.pendingProviders],
    ['Service requests', stats.serviceRequests],
    ['Completed missions', stats.completedMissions],
    ['Communities', stats.communities],
    ['Activities', stats.activities],
    ['Meeting profiles', stats.meetingProfiles],
    ['Chat rooms', stats.chatRooms],
    ['News articles', stats.newsArticles],
    ['Open reports', stats.openReports],
    ['Banned users', stats.bannedUsers],
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
      {error && <AdminErrorBanner message={error} onRetry={load} />}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white p-4 shadow-card">
            <p className="text-xs font-semibold text-ink-500">{label}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-ink-900">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
