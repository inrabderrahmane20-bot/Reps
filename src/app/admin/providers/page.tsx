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
  // Sponsored
  sponsoredOn: boolean;
  sponsorImage: string;
  sponsorPriority: string;
  sponsorStart: string;
  sponsorEnd: string;
  // Promotion
  promoOn: boolean;
  promoType: 'percent' | 'fixed' | 'price';
  promoValue: string;
  promoOriginal: string;
  promoPrice: string;
  promoStart: string;
  promoEnd: string;
  promoDescription: string;
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
    const sp = p.provider?.sponsored;
    const promo = p.provider?.promotion;
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
      sponsoredOn: !!sp?.active,
      sponsorImage: sp?.image || '',
      sponsorPriority: String(sp?.priority ?? 0),
      sponsorStart: sp?.startDate ? sp.startDate.slice(0, 10) : '',
      sponsorEnd: sp?.endDate ? sp.endDate.slice(0, 10) : '',
      promoOn: !!promo,
      promoType: promo?.type || 'percent',
      promoValue: String(promo?.value ?? 0),
      promoOriginal: promo?.originalPrice || '',
      promoPrice: promo?.promotionalPrice || '',
      promoStart: promo?.startDate ? promo.startDate.slice(0, 10) : '',
      promoEnd: promo?.endDate ? promo.endDate.slice(0, 10) : '',
      promoDescription: promo?.description || '',
    });
  }

  async function saveEdit() {
    if (!editFor || !form) return;
    const sponsored = form.sponsoredOn
      ? {
          active: true,
          image: form.sponsorImage,
          priority: Number(form.sponsorPriority) || 0,
          startDate: form.sponsorStart ? `${form.sponsorStart}T00:00:00.000Z` : '',
          endDate: form.sponsorEnd ? `${form.sponsorEnd}T23:59:59.000Z` : '',
        }
      : null;
    const promotion = form.promoOn
      ? {
          type: form.promoType,
          value: Number(form.promoValue) || 0,
          originalPrice: form.promoOriginal || undefined,
          promotionalPrice: form.promoPrice || undefined,
          startDate: form.promoStart ? `${form.promoStart}T00:00:00.000Z` : '',
          endDate: form.promoEnd ? `${form.promoEnd}T23:59:59.000Z` : '',
          description: form.promoDescription || undefined,
        }
      : null;
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
      sponsored,
      promotion,
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
                  <p className="mt-1 text-xs">
                    {p.provider?.sponsored?.active ? (
                      <span className="font-semibold text-majorelle-600">Sponsored (p{p.provider.sponsored.priority})</span>
                    ) : (
                      <span className="text-ink-300">Not sponsored</span>
                    )}
                    {' · '}
                    {p.provider?.promotion ? (
                      <span className="font-semibold text-saffron-600">
                        Promo: {p.provider.promotion.type} {p.provider.promotion.value}
                      </span>
                    ) : (
                      <span className="text-ink-300">No promotion</span>
                    )}
                  </p>
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

            <div className="mt-6 border-t border-ink-900/10 pt-4">
              <h3 className="font-display text-base font-semibold text-ink-900">Sponsored placement</h3>
              <label className="mt-2 inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.sponsoredOn}
                  onChange={(e) => setForm((f) => ({ ...f!, sponsoredOn: e.target.checked }))}
                  className="h-4 w-4 accent-majorelle-600"
                />
                <span className="text-sm font-medium text-ink-700">Mark as sponsored (paid placement)</span>
              </label>
              {form.sponsoredOn && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <EditField label="Sponsor image URL (cover used in placements)">
                      <input value={form.sponsorImage} onChange={(e) => setForm((f) => ({ ...f!, sponsorImage: e.target.value }))} placeholder="https://…" className="adm-input" />
                    </EditField>
                  </div>
                  <EditField label="Priority (higher = first)">
                    <input value={form.sponsorPriority} onChange={(e) => setForm((f) => ({ ...f!, sponsorPriority: e.target.value }))} type="number" className="adm-input" />
                  </EditField>
                  <div className="grid grid-cols-2 gap-3">
                    <EditField label="Start date">
                      <input value={form.sponsorStart} onChange={(e) => setForm((f) => ({ ...f!, sponsorStart: e.target.value }))} type="date" className="adm-input" />
                    </EditField>
                    <EditField label="End date">
                      <input value={form.sponsorEnd} onChange={(e) => setForm((f) => ({ ...f!, sponsorEnd: e.target.value }))} type="date" className="adm-input" />
                    </EditField>
                  </div>
                </div>
              )}
              <p className="mt-2 text-xs text-ink-300">The placement is active only between the start and end dates (inclusive).</p>
            </div>

            <div className="mt-5 border-t border-ink-900/10 pt-4">
              <h3 className="font-display text-base font-semibold text-ink-900">Promotion (Solde)</h3>
              <label className="mt-2 inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.promoOn}
                  onChange={(e) => setForm((f) => ({ ...f!, promoOn: e.target.checked }))}
                  className="h-4 w-4 accent-majorelle-600"
                />
                <span className="text-sm font-medium text-ink-700">Active promotion on this service</span>
              </label>
              {form.promoOn && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <EditField label="Type">
                    <select value={form.promoType} onChange={(e) => setForm((f) => ({ ...f!, promoType: e.target.value as EditForm['promoType'] }))} className="adm-input">
                      <option value="percent">Percentage (−20%)</option>
                      <option value="fixed">Fixed discount (−50 DH)</option>
                      <option value="price">Promotional price</option>
                    </select>
                  </EditField>
                  <EditField label="Value (percent or MAD)">
                    <input value={form.promoValue} onChange={(e) => setForm((f) => ({ ...f!, promoValue: e.target.value }))} type="number" className="adm-input" />
                  </EditField>
                  <EditField label="Original price (display)">
                    <input value={form.promoOriginal} onChange={(e) => setForm((f) => ({ ...f!, promoOriginal: e.target.value }))} placeholder="80 DH" className="adm-input" />
                  </EditField>
                  <EditField label="Promotional price (display)">
                    <input value={form.promoPrice} onChange={(e) => setForm((f) => ({ ...f!, promoPrice: e.target.value }))} placeholder="65 DH" className="adm-input" />
                  </EditField>
                  <div className="grid grid-cols-2 gap-3">
                    <EditField label="Start date">
                      <input value={form.promoStart} onChange={(e) => setForm((f) => ({ ...f!, promoStart: e.target.value }))} type="date" className="adm-input" />
                    </EditField>
                    <EditField label="End date">
                      <input value={form.promoEnd} onChange={(e) => setForm((f) => ({ ...f!, promoEnd: e.target.value }))} type="date" className="adm-input" />
                    </EditField>
                  </div>
                  <div className="sm:col-span-2">
                    <EditField label="Offer description">
                      <input value={form.promoDescription} onChange={(e) => setForm((f) => ({ ...f!, promoDescription: e.target.value }))} placeholder="e.g. −20% ce mois-ci" className="adm-input" />
                    </EditField>
                  </div>
                </div>
              )}
              <p className="mt-2 text-xs text-ink-300">Expired promotions are hidden automatically once the end date passes.</p>
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