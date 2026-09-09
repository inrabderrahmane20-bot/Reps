'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import type { PublicUser } from '@/lib/types';

const TABS = ['pending', 'approved', 'rejected'] as const;

export default function AdminProvidersPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('pending');
  const [providers, setProviders] = useState<PublicUser[]>([]);
  const [rejectReasonFor, setRejectReasonFor] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  function load() {
    api.get<{ providers: PublicUser[] }>(`/admin/providers?status=${tab}`).then((r) => setProviders(r.providers));
  }
  useEffect(load, [tab]);

  async function approve(id: string) {
    await api.patch(`/admin/providers/${id}`, { action: 'approve' });
    load();
  }
  async function reject(id: string) {
    await api.patch(`/admin/providers/${id}`, { action: 'reject', rejectionReason: reason });
    setRejectReasonFor(null);
    setReason('');
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Provider verification</h1>
      <div className="mt-4 flex gap-2">
        {TABS.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${tab === tb ? 'bg-majorelle-600 text-white' : 'bg-white text-ink-700'}`}
          >
            {tb}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {providers.length === 0 && <p className="text-sm text-ink-500">Nothing here.</p>}
        {providers.map((p) => (
          <div key={p.id} className="rounded-2xl bg-white p-4 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex gap-3">
                <img src={p.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-ink-900">
                    {p.firstName} {p.lastName}
                  </p>
                  <p className="text-sm text-ink-500">
                    {p.provider?.title} · {p.provider?.category}
                  </p>
                  <p className="mt-1 text-xs text-ink-500">{p.provider?.description}</p>
                  <p className="mt-1 text-xs text-ink-300">
                    Specialties: {p.provider?.specialties.join(', ') || '—'} · Area: {p.provider?.serviceArea || '—'} · Price:{' '}
                    {p.provider?.priceRange || '—'}
                  </p>
                  <p className="mt-1 text-xs text-ink-300">Documents submitted: {p.provider?.documents.join(', ') || 'none'}</p>
                  {p.provider?.rejectionReason && <p className="mt-1 text-xs text-clay-500">Reason: {p.provider.rejectionReason}</p>}
                </div>
              </div>
              {tab === 'pending' && (
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => approve(p.id)} className="rounded-full bg-zellige-500 px-4 py-2 text-xs font-semibold text-white hover:bg-zellige-600">
                    Approve
                  </button>
                  <button onClick={() => setRejectReasonFor(p.id)} className="rounded-full bg-clay-400 px-4 py-2 text-xs font-semibold text-white hover:bg-clay-500">
                    Reject
                  </button>
                </div>
              )}
              {tab === 'approved' && (
                <button onClick={() => setRejectReasonFor(p.id)} className="shrink-0 rounded-full border border-ink-900/10 px-4 py-2 text-xs font-semibold text-ink-700 hover:bg-sand-100">
                  Suspend verification
                </button>
              )}
            </div>

            {rejectReasonFor === p.id && (
              <div className="mt-3 flex gap-2">
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason (shown to the applicant)"
                  className="flex-1 rounded-xl border border-ink-900/10 px-3 py-2 text-sm focus:border-majorelle-500 focus:outline-none"
                />
                <button onClick={() => reject(p.id)} className="rounded-full bg-clay-500 px-4 py-2 text-xs font-semibold text-white">
                  Confirm
                </button>
                <button onClick={() => setRejectReasonFor(null)} className="rounded-full border border-ink-900/10 px-4 py-2 text-xs font-semibold text-ink-700">
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
