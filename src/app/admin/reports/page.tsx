'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

interface ReportRow {
  id: string;
  reporterName: string;
  targetType: string;
  targetId: string;
  reason: string;
  details: string;
  status: string;
  createdAt: string;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [filter, setFilter] = useState<string>('');

  function load() {
    api.get<{ reports: ReportRow[] }>(`/admin/reports${filter ? `?status=${filter}` : ''}`).then((r) => setReports(r.reports));
  }
  useEffect(load, [filter]);

  async function setStatus(id: string, status: string) {
    await api.patch(`/admin/reports/${id}`, { status });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Reports</h1>
      <div className="mt-4 flex gap-2">
        {['', 'new', 'under_review', 'resolved', 'rejected'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${filter === s ? 'bg-majorelle-600 text-white' : 'bg-white text-ink-700'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>
      <div className="mt-6 space-y-2">
        {reports.length === 0 && <p className="text-sm text-ink-500">No reports.</p>}
        {reports.map((r) => (
          <div key={r.id} className="rounded-2xl bg-white p-4 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                {r.targetType} · {r.reason}
              </p>
              <span className="rounded-full bg-sand-100 px-2.5 py-1 text-xs font-semibold text-ink-700">{r.status}</span>
            </div>
            <p className="mt-1 text-xs text-ink-500">
              Reported by {r.reporterName} · target id {r.targetId} · {new Date(r.createdAt).toLocaleString()}
            </p>
            {r.details && <p className="mt-2 text-sm text-ink-700">{r.details}</p>}
            <div className="mt-3 flex gap-2">
              <button onClick={() => setStatus(r.id, 'under_review')} className="rounded-full border border-ink-900/10 px-3 py-1.5 text-xs font-semibold hover:bg-sand-100">
                Under review
              </button>
              <button onClick={() => setStatus(r.id, 'resolved')} className="rounded-full bg-zellige-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zellige-600">
                Resolve
              </button>
              <button onClick={() => setStatus(r.id, 'rejected')} className="rounded-full bg-clay-400 px-3 py-1.5 text-xs font-semibold text-white hover:bg-clay-500">
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
