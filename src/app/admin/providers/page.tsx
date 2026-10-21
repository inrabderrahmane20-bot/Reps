'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { parsePriceAmount, promotionBadge, promotionPrices } from '@/lib/marketing';
import { validatePromotion, validateSponsored, type MarketingIssue } from '@/lib/marketing-validation';
import type { PromotionInfo, PublicUser, SponsoredPlacement } from '@/lib/types';
import messages from '@/messages/fr.json';

// Admin-only wording is plain English (the admin area is English-only); only
// the public strings of the preview come from the `adminMarketing` namespace.
const T = messages.adminMarketing;

const TABS = ['pending', 'approved', 'rejected'] as const;
const PLACEMENTS: SponsoredPlacement[] = ['home', 'services', 'both'];

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
  sponsorTitle: string;
  sponsorImage: string;
  sponsorPlacement: SponsoredPlacement;
  sponsorPriority: string;
  sponsorStart: string;
  sponsorEnd: string;
  sponsorHref: string;
  sponsorNotes: string;
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

/** "promotion.promotionalPrice" → "promotionalPrice" */
function fieldKey(issue: MarketingIssue): string {
  return issue.field.replace(/^promotion\./, '').replace(/^sponsored\./, '');
}

function issueMap(issues: MarketingIssue[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const issue of issues) map[fieldKey(issue)] = issue.message;
  return map;
}

export default function AdminProvidersPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('pending');
  const [providers, setProviders] = useState<PublicUser[]>([]);
  const [rejectReasonFor, setRejectReasonFor] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [editFor, setEditFor] = useState<PublicUser | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

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
    setFormError(null);
    setFieldErrors({});
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
      sponsorTitle: sp?.title || '',
      sponsorImage: sp?.image || '',
      sponsorPlacement: sp?.placement || 'both',
      sponsorPriority: String(sp?.priority ?? 0),
      sponsorStart: sp?.startDate ? sp.startDate.slice(0, 10) : '',
      sponsorEnd: sp?.endDate ? sp.endDate.slice(0, 10) : '',
      sponsorHref: sp?.href || '',
      sponsorNotes: sp?.notes || '',
      promoOn: !!promo,
      promoType: promo?.type || 'percent',
      promoValue: String(promo?.value ?? 0),
      promoOriginal: promo?.originalPrice || (promo?.originalPriceValue != null ? `${promo.originalPriceValue} DH` : ''),
      promoPrice: promo?.promotionalPrice || (promo?.promotionalPriceValue != null ? `${promo.promotionalPriceValue} DH` : ''),
      promoStart: promo?.startDate ? promo.startDate.slice(0, 10) : '',
      promoEnd: promo?.endDate ? promo.endDate.slice(0, 10) : '',
      promoDescription: promo?.description || '',
    });
  }

  async function saveEdit() {
    if (!editFor || !form) return;

    // --- sponsored campaign ------------------------------------------------
    const existing = editFor.provider?.sponsored;
    const sponsored =
      form.sponsoredOn
        ? {
            active: true,
            title: form.sponsorTitle.trim() || undefined,
            image: form.sponsorImage.trim(),
            placement: form.sponsorPlacement,
            priority: Number(form.sponsorPriority) || 0,
            startDate: form.sponsorStart ? `${form.sponsorStart}T00:00:00.000Z` : '',
            endDate: form.sponsorEnd ? `${form.sponsorEnd}T23:59:59.000Z` : '',
            href: form.sponsorHref.trim() || undefined,
            notes: form.sponsorNotes.trim() || undefined,
          }
        : existing
          ? { ...existing, active: false }
          : null;

    // --- promotion ---------------------------------------------------------
    const originalAmount = parsePriceAmount(form.promoOriginal);
    const promoAmount = parsePriceAmount(form.promoPrice);
    const promotion = form.promoOn
      ? {
          type: form.promoType,
          value: Number(form.promoValue) || 0,
          originalPrice: form.promoOriginal.trim() || undefined,
          promotionalPrice: form.promoPrice.trim() || undefined,
          ...(originalAmount !== null ? { originalPriceValue: originalAmount } : {}),
          ...(promoAmount !== null ? { promotionalPriceValue: promoAmount } : {}),
          startDate: form.promoStart ? `${form.promoStart}T00:00:00.000Z` : '',
          endDate: form.promoEnd ? `${form.promoEnd}T23:59:59.000Z` : '',
          description: form.promoDescription.trim() || undefined,
        }
      : null;

    // Same rules as the server: catch the problem before the round trip so the
    // message lands on the offending field.
    const issues: MarketingIssue[] = [];
    if (sponsored) {
      const check = validateSponsored(sponsored);
      if (!check.ok) issues.push(...check.issues);
    }
    if (promotion) {
      const check = validatePromotion(promotion);
      if (!check.ok) issues.push(...check.issues);
    }
    if (issues.length) {
      setFieldErrors(issueMap(issues));
      setFormError(issues[0].message);
      return;
    }
    setFieldErrors({});
    setFormError(null);

    setSaving(true);
    try {
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
    } catch (err: any) {
      setFormError(err?.message || 'The provider could not be saved.');
    } finally {
      setSaving(false);
    }
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
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-lg font-semibold text-ink-900">
              Edit provider — {editFor.firstName} {editFor.lastName}
            </h2>
            {formError && (
              <p className="mt-3 rounded-xl border border-clay-400/40 bg-clay-400/10 px-4 py-2.5 text-sm font-medium text-clay-500">{formError}</p>
            )}
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
                    <EditField label="Campaign title">
                      <input
                        value={form.sponsorTitle}
                        onChange={(e) => setForm((f) => ({ ...f!, sponsorTitle: e.target.value }))}
                        placeholder="Spring campaign"
                        className="adm-input"
                      />
                    </EditField>
                  </div>
                  <div className="sm:col-span-2">
                    <EditField label="Sponsor image URL (cover used in placements)" error={fieldErrors.image}>
                      <input
                        value={form.sponsorImage}
                        onChange={(e) => setForm((f) => ({ ...f!, sponsorImage: e.target.value }))}
                        placeholder="https://…"
                        className="adm-input"
                      />
                    </EditField>
                  </div>
                  <EditField label="Placement" error={fieldErrors.placement}>
                    <select
                      value={form.sponsorPlacement}
                      onChange={(e) => setForm((f) => ({ ...f!, sponsorPlacement: e.target.value as SponsoredPlacement }))}
                      className="adm-input"
                    >
                      {PLACEMENTS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </EditField>
                  <EditField label="Priority (higher = first)" error={fieldErrors.priority}>
                    <input
                      value={form.sponsorPriority}
                      onChange={(e) => setForm((f) => ({ ...f!, sponsorPriority: e.target.value }))}
                      type="number"
                      className="adm-input"
                    />
                  </EditField>
                  <div className="grid grid-cols-2 gap-3">
                    <EditField label="Start date" error={fieldErrors.startDate}>
                      <input
                        value={form.sponsorStart}
                        onChange={(e) => setForm((f) => ({ ...f!, sponsorStart: e.target.value }))}
                        type="date"
                        className="adm-input"
                      />
                    </EditField>
                    <EditField label="End date" error={fieldErrors.endDate}>
                      <input
                        value={form.sponsorEnd}
                        onChange={(e) => setForm((f) => ({ ...f!, sponsorEnd: e.target.value }))}
                        type="date"
                        className="adm-input"
                      />
                    </EditField>
                  </div>
                  <div className="sm:col-span-2">
                    <EditField label="Internal link (optional)" error={fieldErrors.href}>
                      <input
                        value={form.sponsorHref}
                        onChange={(e) => setForm((f) => ({ ...f!, sponsorHref: e.target.value }))}
                        placeholder="/fr/services/…"
                        className="adm-input"
                      />
                    </EditField>
                  </div>
                  <div className="sm:col-span-2">
                    <EditField label="Internal notes (never public)" error={fieldErrors.notes}>
                      <input
                        value={form.sponsorNotes}
                        onChange={(e) => setForm((f) => ({ ...f!, sponsorNotes: e.target.value }))}
                        className="adm-input"
                      />
                    </EditField>
                  </div>
                </div>
              )}
              <p className="mt-2 text-xs text-ink-300">
                The placement is active only between the start and end dates (inclusive). Titles, placement and link are managed on the
                Campaigns page.
              </p>
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
                  <EditField label="Type" error={fieldErrors.type}>
                    <select
                      value={form.promoType}
                      onChange={(e) => setForm((f) => ({ ...f!, promoType: e.target.value as EditForm['promoType'] }))}
                      className="adm-input"
                    >
                      <option value="percent">Percentage (−20%)</option>
                      <option value="fixed">Fixed discount (−50 DH)</option>
                      <option value="price">Promotional price</option>
                    </select>
                  </EditField>
                  <EditField label="Value (percent or MAD)" error={fieldErrors.value}>
                    <input
                      value={form.promoValue}
                      onChange={(e) => setForm((f) => ({ ...f!, promoValue: e.target.value }))}
                      type="number"
                      className="adm-input"
                    />
                  </EditField>
                  <EditField label="Original price (display)" error={fieldErrors.originalPrice}>
                    <input
                      value={form.promoOriginal}
                      onChange={(e) => setForm((f) => ({ ...f!, promoOriginal: e.target.value }))}
                      placeholder="80 DH"
                      className="adm-input"
                    />
                  </EditField>
                  <EditField label="Promotional price (display)" error={fieldErrors.promotionalPrice}>
                    <input
                      value={form.promoPrice}
                      onChange={(e) => setForm((f) => ({ ...f!, promoPrice: e.target.value }))}
                      placeholder="65 DH"
                      className="adm-input"
                    />
                  </EditField>
                  <div className="grid grid-cols-2 gap-3">
                    <EditField label="Start date" error={fieldErrors.startDate}>
                      <input
                        value={form.promoStart}
                        onChange={(e) => setForm((f) => ({ ...f!, promoStart: e.target.value }))}
                        type="date"
                        className="adm-input"
                      />
                    </EditField>
                    <EditField label="End date" error={fieldErrors.endDate}>
                      <input
                        value={form.promoEnd}
                        onChange={(e) => setForm((f) => ({ ...f!, promoEnd: e.target.value }))}
                        type="date"
                        className="adm-input"
                      />
                    </EditField>
                  </div>
                  <div className="sm:col-span-2">
                    <EditField label="Offer description">
                      <input
                        value={form.promoDescription}
                        onChange={(e) => setForm((f) => ({ ...f!, promoDescription: e.target.value }))}
                        placeholder="e.g. −20% ce mois-ci"
                        className="adm-input"
                      />
                    </EditField>
                  </div>
                  <div className="sm:col-span-2">
                    <PromotionPreview form={form} />
                  </div>
                </div>
              )}
              <p className="mt-2 text-xs text-ink-300">Expired promotions are hidden automatically once the end date passes.</p>
            </div>

            <p className="mt-3 text-xs text-ink-500">
              Changing the position updates the provider's zone. Saving a rejected/suspended provider moves it back to pending review.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={saveEdit}
                disabled={saving}
                className="rounded-full bg-majorelle-600 px-5 py-2 text-sm font-semibold text-white hover:bg-majorelle-700 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save changes'}
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

function EditField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink-700">{label}</span>
      <span className="mt-1 block">{children}</span>
      {error && <span className="mt-1 block text-xs font-medium text-clay-500">{error}</span>}
    </label>
  );
}

/**
 * Live preview of the promotional offer card, built from the form values:
 * the discount badge, the price comparison and the validity date — exactly
 * what the public marketplace will show.
 */
function PromotionPreview({ form }: { form: EditForm }) {
  const originalAmount = parsePriceAmount(form.promoOriginal);
  const promoAmount = parsePriceAmount(form.promoPrice);

  const promo: PromotionInfo = {
    type: form.promoType,
    value: Number(form.promoValue) || 0,
    originalPrice: form.promoOriginal.trim() || undefined,
    promotionalPrice: form.promoPrice.trim() || undefined,
    ...(originalAmount !== null ? { originalPriceValue: originalAmount } : {}),
    ...(promoAmount !== null ? { promotionalPriceValue: promoAmount } : {}),
    startDate: form.promoStart ? `${form.promoStart}T00:00:00.000Z` : '',
    endDate: form.promoEnd ? `${form.promoEnd}T23:59:59.000Z` : '',
    description: form.promoDescription.trim() || undefined,
  };

  const prices = promotionPrices(promo);
  const badge = promotionBadge(promo);
  const end = Date.parse(promo.endDate);
  const validUntil = Number.isNaN(end)
    ? null
    : T.promoValidUntil.replace('{date}', new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }).format(new Date(end)));

  // The discount implied by the two prices — shown while editing so an
  // inconsistent pair is visible before saving.
  let derived: string | null = null;
  let derivedWarning: string | null = null;
  if (originalAmount !== null && promoAmount !== null) {
    if (promoAmount >= originalAmount) {
      derivedWarning = 'The promotional price must be lower than the original price.';
    } else {
      const percent = Math.round(((originalAmount - promoAmount) / originalAmount) * 100);
      derived = `-${percent}% · -${Math.round(originalAmount - promoAmount)} DH`;
      const declared = Number(form.promoValue) || 0;
      if (form.promoType === 'percent' && Math.abs(percent - declared) > 1) {
        derivedWarning = `The prices describe a ${percent}% discount, but the value says ${declared}%.`;
      }
      if (form.promoType === 'fixed' && Math.abs(Math.round(originalAmount - promoAmount) - declared) > 1) {
        derivedWarning = `The prices describe a ${Math.round(originalAmount - promoAmount)} MAD discount, but the value says ${declared} MAD.`;
      }
    }
  } else if (form.promoOriginal.trim() || form.promoPrice.trim()) {
    derivedWarning = 'Prices must be simple amounts, e.g. “250 DH”.';
  }

  return (
    <div className="rounded-2xl border border-ink-900/[0.06] bg-sand-50 p-4">
      <p className="text-xs font-semibold uppercase text-ink-500">Preview</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-br from-sunset-500 to-sunset-600 px-2.5 py-1 text-xs font-bold text-white shadow-sunset">
          {badge}
        </span>
        {(promo.originalPrice || promo.promotionalPrice) && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
            {promo.originalPrice && <span className="text-ink-400 line-through decoration-clay-400/70">{promo.originalPrice}</span>}
            {promo.promotionalPrice && <span className="font-bold text-sunset-700">{promo.promotionalPrice}</span>}
          </span>
        )}
        {validUntil && (
          <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-clay-500">
            <span className="h-1.5 w-1.5 rounded-full bg-clay-400" aria-hidden />
            {validUntil}
          </span>
        )}
      </div>
      <p className="mt-2 text-xs text-ink-500">
        {prices.original !== null && prices.current !== null
          ? `Stored prices: ${prices.original} DH → ${prices.current} DH`
          : 'No price pair yet — the offer shows the declared discount only.'}
      </p>
      {derived && <p className="mt-1 text-xs font-semibold text-zellige-600">Derived discount: {derived}</p>}
      {derivedWarning && <p className="mt-1 text-xs font-semibold text-clay-500">{derivedWarning}</p>}
      {promo.description && <p className="mt-1 text-xs text-ink-500">{promo.description}</p>}
    </div>
  );
}
