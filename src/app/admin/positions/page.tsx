'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

interface PositionRow {
  id: string;
  name: string;
  email: string;
  category: string;
  providerStatus: string;
  availability: string;
  lat: number;
  lng: number;
  zoneId: string;
}

export default function AdminPositionsPage() {
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [drafts, setDrafts] = useState<Record<string, { lat: string; lng: string }>>({});

  function load() {
    api.get<{ positions: PositionRow[] }>('/admin/positions').then((r) => setPositions(r.positions));
  }
  useEffect(load, []);

  useEffect(() => {
    setDrafts((prev) => {
      const next: Record<string, { lat: string; lng: string }> = {};
      for (const p of positions) {
        next[p.id] = prev[p.id] ?? { lat: String(p.lat), lng: String(p.lng) };
      }
      return next;
    });
  }, [positions]);

  const visible = statusFilter === 'all' ? positions : positions.filter((p) => p.providerStatus === statusFilter);

  async function save(p: PositionRow) {
    const draft = drafts[p.id];
    await api.patch(`/admin/positions/${p.id}`, { lat: Number(draft.lat), lng: Number(draft.lng) });
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Provider positions</h1>
        <div className="flex gap-2">
          {['all', 'approved', 'pending', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${statusFilter === s ? 'bg-majorelle-600 text-white' : 'bg-white text-ink-700'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
        Edit the approximate service-area coordinate used to place each provider on the map and to match their zone. Changing the position
        re-classifies which neighborhood zone the provider serves.
      </p>

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-900/5 text-start text-xs font-semibold uppercase text-ink-500">
              <th className="p-3 text-start">Provider</th>
              <th className="p-3 text-start">Category</th>
              <th className="p-3 text-start">Status</th>
              <th className="p-3 text-start">Zone</th>
              <th className="p-3 text-start">Latitude</th>
              <th className="p-3 text-start">Longitude</th>
              <th className="p-3 text-start">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p.id} className="border-b border-ink-900/5 last:border-0">
                <td className="p-3">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-ink-400">{p.email}</p>
                </td>
                <td className="p-3 text-ink-500">{p.category}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.providerStatus === 'approved' ? 'bg-zellige-500/10 text-zellige-600' : p.providerStatus === 'pending' ? 'bg-saffron-500/10 text-saffron-600' : 'bg-clay-400/10 text-clay-500'}`}>
                    {p.providerStatus}
                  </span>
                </td>
                <td className="p-3 text-ink-500">{p.zoneId}</td>
                <td className="p-3">
                  <input
                    value={drafts[p.id]?.lat ?? ''}
                    onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...(d[p.id] ?? { lat: '', lng: '' }), lat: e.target.value } }))}
                    className="w-28 rounded-lg border border-ink-900/10 px-2.5 py-1.5 text-sm focus:border-majorelle-500 focus:outline-none"
                  />
                </td>
                <td className="p-3">
                  <input
                    value={drafts[p.id]?.lng ?? ''}
                    onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: { ...(d[p.id] ?? { lat: '', lng: '' }), lng: e.target.value } }))}
                    className="w-28 rounded-lg border border-ink-900/10 px-2.5 py-1.5 text-sm focus:border-majorelle-500 focus:outline-none"
                  />
                </td>
                <td className="p-3">
                  <button onClick={() => save(p)} className="rounded-full bg-majorelle-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-majorelle-700">
                    Save
                  </button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-sm text-ink-400">
                  No providers in this status.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}