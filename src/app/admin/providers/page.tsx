'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import type { PublicUser } from '@/lib/types';

const TABS = ['pending', 'approved', 'rejected'] as const;

interface EditForm {
  category: string;
  title: string;
  description: string;
  specialties: string;
  serviceArea: string;
  priceRange: string;
  availability: string;
  lat: string;
  lng: string;
}

export default function AdminProvidersPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('pending');
  const [providers, setProviders] = useState<PublicUser[]>([]);
  const [rejectReasonFor, setRejectReasonFor] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [editFor, setEditFor] = useState<PublicUser | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);

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
  async function suspend(id: string) {
    await api.patch(`/admin/providers/${id}`, { action: 'suspend' });
    load();
  }

  function openEdit(p: PublicUser) {
    setEditFor(p);
    setForm({
      category: p.provider?.category || '',
      title: p.provider?.title || '',
      description: p.provider?.description || '',
      specialties: (p.provider?.specialties || []).join(', '),
      serviceArea: p.provider?.serviceArea || '',
      priceRange: p.provider?.priceRange || '',
      availability: p.provider?.availability || 'later',
      lat: String(p.provider?.lat ?? ''),
      lng: String(p.provider?.lng ?? ''),
    });
  }

  async function saveEdit() {
    if (!editFor || !form) return;
    await api.patch(`/admin/providers/${editFor.id}`, {
      category: form.category,
      title: form.title,
      description: form.description,
      specialties: form.specialties.split(',').map((s) => s.trim()).filter(Boolean),
      serviceArea: form.serviceArea,
      priceRange: form.priceRange,
      availability: form.availability,
      lat: form.lat ? Number(form.lat) : undefined,
      lng: form.lng ? Number(form.lng) : undefined,
    });
    setEditFor(null);
    setForm(null);
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
                    {p.provider?.priceRange || '—'} · Position: {p.provider?.lat?.toFixed(4)}, {p.provider?.lng?.toFixed(4)}
                  </p>
                  <p className="mt-1 text-xs text-ink-300">Documents submitted: {p.provider?.documents.join(', ') || 'none'}</p>
                  {p.provider?.rejectionReason && <p className="mt-1 text-xs text-clay-500">Reason: {p.provider.rejectionReason}</p>}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {tab === 'pending' && (
                  <>
                    <button onClick={() => approve(p.id)} className="rounded-full bg-zellige-500 px-4 py-2 text-xs font-semibold text-white hover:bg-zellige-600">
                      Approve
                    </button>
                    <button onClick={() => setRejectReasonFor(p.id)} className="rounded-full bg-clay-400 px-4 py-2 text-xs font-semibold text-white hover:bg-clay-500">
                      Reject
                    </button>
                  </>
                )}
                {tab === 'approved' && (
                  <button onClick={() => suspend(p.id)} className="rounded-full border border-ink-900/10 px-4 py-2 text-xs font-semibold text-ink-700 hover:bg-sand-100">
                    Suspend
                  </button>
                )}
                {tab !== 'pending' && (
                  <button onClick={() => setRejectReasonFor(p.id)} className="rounded-full border border-ink-900/10 px-4 py-2 text-xs font-semibold text-ink-700 hover:bg-sand-100">
                    Reject
                  </button>
                )}
                <button onClick={() => openEdit(p)} className="rounded-full bg-majorelle-600 px-4 py-2 text-xs font-semibold text-white hover:bg-majorelle-700">
                  Edit
                </button>
              </div>
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

      {editFor && form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4" onClick={() => setEditFor(null)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-lg font-semibold text-ink-900">
              Edit provider — {editFor.firstName} {editFor.lastName}
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <EditField label="Category">
                <input value={form.category} onChange={(e) => setForm((f) => ({ ...f!, category: e.target.value }))} className="adm-input" />
              </EditField>
              <EditField label="Title">
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f!, title: e.target.value }))} className="adm-input" />
              </EditField>
              <div className="sm:col-span-2">
                <EditField label="Description">
                  <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f!, description: e.target.value }))} rows={3} className="adm-input" />
                </EditField>
              </div>
              <EditField label="Specialties (comma separated)">
                <input value={form.specialties} onChange={(e) => setForm((f) => ({ ...f!, specialties: e.target.value }))} className="adm-input" />
              </EditField>
              <EditField label="Service area">
                <input value={form.serviceArea} onChange={(e) => setForm((f) => ({ ...f!, serviceArea: e.target.value }))} className="adm-input" />
              </EditField>
              <EditField label="Price range">
                <input value={form.priceRange} onChange={(e) => setForm((f) => ({ ...f!, priceRange: e.target.value }))} className="adm-input" />
              </EditField>
              <EditField label="Availability">
                <select value={form.availability} onChange={(e) => setForm((f) => ({ ...f!, availability: e.target.value }))} className="adm-input">
                  <option value="available">Available</option>
                  <option value="later">Available later</option>
                  <option value="offline">Offline</option>
                </select>
              </EditField>
              <EditField label="Latitude">
                <input value={form.lat} onChange={(e) => setForm((f) => ({ ...f!, lat: e.target.value }))} placeholder="31.6295" className="adm-input" />
              </EditField>
              <EditField label="Longitude">
                <input value={form.lng} onChange={(e) => setForm((f) => ({ ...f!, lng: e.target.value }))} placeholder="-8.0089" className="adm-input" />
              </EditField>
            </div>
            <p className="mt-3 text-xs text-ink-500">
              Changing the position updates the provider's zone. Saving a rejected/suspended provider moves it back to pending review.
            </p>
            <div className="mt-4 flex gap-2">
              <button onClick={saveEdit} className="rounded-full bg-majorelle-600 px-5 py-2 text-sm font-semibold text-white hover:bg-majorelle-700">
                Save changes
              </button>
              <button onClick={() => setEditFor(null)} className="rounded-full border border-ink-900/10 px-5 py-2 text-sm font-semibold text-ink-700 hover:bg-sand-100">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink-700">{label}</span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}