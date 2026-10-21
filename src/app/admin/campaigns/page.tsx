'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api-client';
import { PLACEMENTS, validateSponsored, type MarketingIssue } from '@/lib/marketing-validation';
import type { SponsoredCampaign, SponsoredPlacement } from '@/lib/types';
import messages from '@/messages/fr.json';

// The admin area is English-only, but the preview must show the *public*
// wording of the placement card — those strings live in the `adminMarketing`
// namespace (same keys in fr/ar/en). Bundling just that namespace keeps the
// admin surface free of the localized app layout (and of any network call for
// the messages).
const MARKETING_MESSAGES = messages.adminMarketing;

type CampaignState = 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'DISABLED';

interface CampaignRow {
  id: string;
  providerId: string;
  providerName: string;
  providerTitle: string;
  category: string;
  avatar: string;
  campaign: SponsoredCampaign;
  state: CampaignState;
}

interface ProviderOption {
  id: string;
  name: string;
  title: string;
  category: string;
  avatar: string;
  hasCampaign: boolean;
}

interface Draft {
  active: boolean;
  title: string;
  image: string;
  placement: SponsoredPlacement;
  priority: string;
  startDate: string;
  endDate: string;
  href: string;
  notes: string;
}

const EMPTY_DRAFT: Draft = {
  active: true,
  title: '',
  image: '',
  placement: 'both',
  priority: '0',
  startDate: '',
  endDate: '',
  href: '',
  notes: '',
};

function toDraft(campaign: SponsoredCampaign): Draft {
  return {
    active: !!campaign.active,
    title: campaign.title || '',
    image: campaign.image || '',
    placement: campaign.placement || 'both',
    priority: String(campaign.priority ?? 0),
    startDate: campaign.startDate ? campaign.startDate.slice(0, 10) : '',
    endDate: campaign.endDate ? campaign.endDate.slice(0, 10) : '',
    href: campaign.href || '',
    notes: campaign.notes || '',
  };
}

/** Draft → API payload. Dates are sent as full ISO instants (inclusive end). */
function toPayload(draft: Draft) {
  return {
    active: draft.active,
    title: draft.title.trim() || undefined,
    image: draft.image.trim(),
    placement: draft.placement,
    priority: Number(draft.priority) || 0,
    startDate: draft.startDate ? `${draft.startDate}T00:00:00.000Z` : '',
    endDate: draft.endDate ? `${draft.endDate}T23:59:59.000Z` : '',
    href: draft.href.trim() || undefined,
    notes: draft.notes.trim() || undefined,
  };
}

/** "sponsored.image" → "image" so the message lands on the right input. */
function fieldKey(issue: MarketingIssue): string {
  return issue.field.replace(/^sponsored\./, '');
}

function issueMap(issues: MarketingIssue[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const issue of issues) map[fieldKey(issue)] = issue.message;
  return map;
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  // Validation messages keyed by "providerId.field".
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createProvider, setCreateProvider] = useState('');
  const [createDraft, setCreateDraft] = useState<Draft>(EMPTY_DRAFT);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [createError, setCreateError] = useState<string | null>(null);
  // Live validation of the create form (same rules the server will re-run).
  const createLive = draftErrors(createDraft);

  function load() {
    setLoading(true);
    api
      .get<{ campaigns: CampaignRow[]; providers: ProviderOption[] }>('/admin/campaigns')
      .then((r) => {
        setCampaigns(r.campaigns);
        setProviders(r.providers);
        setDrafts((prev) => {
          const next = { ...prev };
          for (const row of r.campaigns) if (!next[row.id]) next[row.id] = toDraft(row.campaign);
          return next;
        });
      })
      .catch((err) => setBanner(err?.message || 'Could not load the campaigns.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  // Campaigns grouped by provider, so a provider can never be offered a second
  // campaign from the "create" dropdown (the API validates this too).
  const usedProviderIds = useMemo(() => new Set(campaigns.map((c) => c.providerId)), [campaigns]);
  const availableProviders = useMemo(
    () => providers.filter((p) => !usedProviderIds.has(p.id)),
    [providers, usedProviderIds]
  );

  function startEdit(row: CampaignRow) {
    setEditingId(row.id);
    setDrafts((d) => ({ ...d, [row.id]: toDraft(row.campaign) }));
    setErrors({});
    setBanner(null);
  }

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((d) => ({ ...d, [id]: { ...(d[id] ?? EMPTY_DRAFT), ...patch } }));
  }

  /** Validation messages produced by the live rules, keyed by "field". */
  function draftErrors(draft: Draft): Record<string, string> {
    const check = validateSponsored(toPayload(draft));
    return check.ok ? {} : issueMap(check.issues);
  }

  async function save(row: CampaignRow) {
    const draft = drafts[row.id] ?? toDraft(row.campaign);
    const payload = toPayload(draft);
    const local = draftErrors(draft);

    // Same rules as the server: catch the problem before the round trip.
    if (Object.keys(local).length) {
      setErrors(local);
      setBanner(null);
      return;
    }
    setErrors({});
    setSavingId(row.id);
    setBanner(null);
    try {
      await api.patch(`/admin/campaigns/${row.id}`, payload);
      await load();
      setEditingId(null);
    } catch (err: any) {
      setBanner(err?.message || 'The campaign could not be saved.');
      setErrors(local);
    } finally {
      setSavingId(null);
    }
  }

  async function toggle(row: CampaignRow) {
    setSavingId(row.id);
    setBanner(null);
    try {
      await api.patch(`/admin/campaigns/${row.id}`, { action: row.campaign.active ? 'disable' : 'enable' });
      await load();
    } catch (err: any) {
      setBanner(err?.message || 'The campaign could not be updated.');
    } finally {
      setSavingId(null);
    }
  }

  async function remove(row: CampaignRow) {
    if (!window.confirm(`Delete the sponsored campaign of ${row.providerName}?`)) return;
    setSavingId(row.id);
    setBanner(null);
    try {
      await api.delete(`/admin/campaigns/${row.id}`);
      if (editingId === row.id) setEditingId(null);
      await load();
    } catch (err: any) {
      setBanner(err?.message || 'The campaign could not be deleted.');
    } finally {
      setSavingId(null);
    }
  }

  async function create() {
    if (!createProvider) {
      setCreateError('Pick a provider first.');
      return;
    }
    const payload = toPayload(createDraft);
    const local = draftErrors(createDraft);
    if (Object.keys(local).length) {
      setCreateErrors(local);
      setCreateError(null);
      return;
    }
    setCreateErrors({});
    setCreateError(null);
    setSavingId('create');
    try {
      await api.post('/admin/campaigns', { providerId: createProvider, ...payload });
      setCreating(false);
      setCreateProvider('');
      setCreateDraft(EMPTY_DRAFT);
      await load();
    } catch (err: any) {
      setCreateError(err?.message || 'The campaign could not be created.');
      setCreateErrors(local);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Sponsored campaigns</h1>
        <button
          onClick={() => {
            setCreating((c) => !c);
            setCreateError(null);
            setCreateErrors({});
          }}
          className="rounded-full bg-majorelle-600 px-4 py-2 text-sm font-semibold text-white hover:bg-majorelle-700"
        >
          {creating ? 'Close' : 'New campaign'}
        </button>
      </div>
      <p className="mt-1.5 max-w-3xl text-sm text-ink-500">
        Paid placements shown in the marketplace. A campaign is live only when it is enabled and the current date is between its start and
        end dates. The link must stay inside the site — external destinations are rejected.
      </p>

      {banner && (
        <p className="mt-4 rounded-xl border border-clay-400/40 bg-clay-400/10 px-4 py-3 text-sm font-medium text-clay-500">{banner}</p>
      )}

      {creating && (
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-card">
          <h2 className="font-display text-lg font-semibold text-ink-900">Create a campaign</h2>
          {createError && <p className="mt-2 text-sm font-medium text-clay-500">{createError}</p>}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Provider">
                  <select value={createProvider} onChange={(e) => setCreateProvider(e.target.value)} className="adm-input">
                    <option value="">— choose a provider —</option>
                    {availableProviders.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.title}
                      </option>
                    ))}
                  </select>
                </Field>
                <p className="mt-1 text-xs text-ink-400">
                  {availableProviders.length} approved provider(s) without a campaign. Every provider can run one campaign at a time.
                </p>
              </div>
              <Field label="Campaign title">
                <input value={createDraft.title} onChange={(e) => setCreateDraft((d) => ({ ...d, title: e.target.value }))} className="adm-input" />
              </Field>
              <Field label="Placement">
                <select
                  value={createDraft.placement}
                  onChange={(e) => setCreateDraft((d) => ({ ...d, placement: e.target.value as SponsoredPlacement }))}
                  className="adm-input"
                >
                  {PLACEMENTS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Image URL" error={createErrors.image || createLive['image']}>
                  <input
                    value={createDraft.image}
                    onChange={(e) => setCreateDraft((d) => ({ ...d, image: e.target.value }))}
                    placeholder="https://…"
                    className="adm-input"
                  />
                </Field>
              </div>
              <Field label="Priority (higher = first)" error={createErrors.priority || createLive['priority']}>
                <input
                  value={createDraft.priority}
                  onChange={(e) => setCreateDraft((d) => ({ ...d, priority: e.target.value }))}
                  type="number"
                  className="adm-input"
                />
              </Field>
              <Field label="Internal link (optional)" error={createErrors.href || createLive['href']}>
                <input
                  value={createDraft.href}
                  onChange={(e) => setCreateDraft((d) => ({ ...d, href: e.target.value }))}
                  placeholder="/fr/services/…"
                  className="adm-input"
                />
              </Field>
              <Field label="Start date" error={createErrors.startDate || createLive['startDate']}>
                <input
                  value={createDraft.startDate}
                  onChange={(e) => setCreateDraft((d) => ({ ...d, startDate: e.target.value }))}
                  type="date"
                  className="adm-input"
                />
              </Field>
              <Field label="End date" error={createErrors.endDate || createLive['endDate']}>
                <input
                  value={createDraft.endDate}
                  onChange={(e) => setCreateDraft((d) => ({ ...d, endDate: e.target.value }))}
                  type="date"
                  className="adm-input"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Internal notes (never public)" error={createErrors.notes || createLive['notes']}>
                  <input
                    value={createDraft.notes}
                    onChange={(e) => setCreateDraft((d) => ({ ...d, notes: e.target.value }))}
                    className="adm-input"
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={createDraft.active}
                    onChange={(e) => setCreateDraft((d) => ({ ...d, active: e.target.checked }))}
                    className="h-4 w-4 accent-majorelle-600"
                  />
                  <span className="text-sm font-medium text-ink-700">Enabled</span>
                </label>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-ink-500">Preview</p>
              <div className="mt-2">
                <CampaignPreview
                  name={providers.find((p) => p.id === createProvider)?.name || 'Provider name'}
                  title={providers.find((p) => p.id === createProvider)?.title || 'Service title'}
                  avatar={providers.find((p) => p.id === createProvider)?.avatar || ''}
                  draft={createDraft}
                />
              </div>
              <button
                onClick={create}
                disabled={savingId === 'create'}
                className="mt-4 rounded-full bg-majorelle-600 px-5 py-2 text-sm font-semibold text-white hover:bg-majorelle-700 disabled:opacity-60"
              >
                {savingId === 'create' ? 'Creating…' : 'Create campaign'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-900/5 text-start text-xs font-semibold uppercase text-ink-500">
              <th className="p-3 text-start">Provider</th>
              <th className="p-3 text-start">Campaign</th>
              <th className="p-3 text-start">Image</th>
              <th className="p-3 text-start">Placement</th>
              <th className="p-3 text-start">Priority</th>
              <th className="p-3 text-start">Window</th>
              <th className="p-3 text-start">State</th>
              <th className="p-3 text-start">Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((row) => {
              const draft = drafts[row.id] ?? toDraft(row.campaign);
              const isEditing = editingId === row.id;
              // Live validation, exactly as the server will re-check it.
              const live = draftErrors(draft);
              const err = (field: string) => errors[`${row.id}.${field}`] || live[field];
              return [
                <tr key={row.id} className="border-b border-ink-900/5 align-top last:border-0">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {row.avatar && <img src={row.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />}
                      <div>
                        <p className="font-medium">{row.providerName}</p>
                        <p className="text-xs text-ink-400">{row.providerTitle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-ink-500">{row.campaign.title || '—'}</td>
                  <td className="p-3">
                    {row.campaign.image ? (
                      <img src={row.campaign.image} alt="" className="h-10 w-16 rounded-lg object-cover" />
                    ) : (
                      <span className="text-xs text-ink-400">no image</span>
                    )}
                  </td>
                  <td className="p-3 text-ink-500">{row.campaign.placement || 'both'}</td>
                  <td className="p-3 text-ink-500">{row.campaign.priority ?? 0}</td>
                  <td className="p-3 text-xs text-ink-500">
                    {row.campaign.startDate ? row.campaign.startDate.slice(0, 10) : '—'} →{' '}
                    {row.campaign.endDate ? row.campaign.endDate.slice(0, 10) : '—'}
                  </td>
                  <td className="p-3">
                    <StateBadge state={row.state} />
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => toggle(row)}
                        disabled={savingId === row.id}
                        className="rounded-full border border-ink-900/10 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-sand-100 disabled:opacity-60"
                      >
                        {row.campaign.active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => {
                          if (isEditing) {
                            setEditingId(null);
                            setErrors({});
                          } else {
                            startEdit(row);
                          }
                        }}
                        className="rounded-full bg-majorelle-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-majorelle-700"
                      >
                        {isEditing ? 'Close' : 'Edit'}
                      </button>
                      <button
                        onClick={() => remove(row)}
                        disabled={savingId === row.id}
                        className="rounded-full bg-clay-400 px-3 py-1.5 text-xs font-semibold text-white hover:bg-clay-500 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>,
                isEditing ? (
                  <tr key={`${row.id}-edit`} className="border-b border-ink-900/5 bg-sand-50/60">
                    <td colSpan={8} className="p-4">
                      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <Field label="Campaign title">
                              <input
                                value={draft.title}
                                onChange={(e) => updateDraft(row.id, { title: e.target.value })}
                                className="adm-input"
                              />
                            </Field>
                          </div>
                          <div className="sm:col-span-2">
                            <Field label="Image URL" error={err('image')}>
                              <input
                                value={draft.image}
                                onChange={(e) => updateDraft(row.id, { image: e.target.value })}
                                placeholder="https://…"
                                className="adm-input"
                              />
                            </Field>
                          </div>
                          <Field label="Placement" error={err('placement')}>
                            <select
                              value={draft.placement}
                              onChange={(e) => updateDraft(row.id, { placement: e.target.value as SponsoredPlacement })}
                              className="adm-input"
                            >
                              {PLACEMENTS.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label="Priority (higher = first)" error={err('priority')}>
                            <input
                              value={draft.priority}
                              onChange={(e) => updateDraft(row.id, { priority: e.target.value })}
                              type="number"
                              className="adm-input"
                            />
                          </Field>
                          <Field label="Start date" error={err('startDate')}>
                            <input
                              value={draft.startDate}
                              onChange={(e) => updateDraft(row.id, { startDate: e.target.value })}
                              type="date"
                              className="adm-input"
                            />
                          </Field>
                          <Field label="End date" error={err('endDate')}>
                            <input
                              value={draft.endDate}
                              onChange={(e) => updateDraft(row.id, { endDate: e.target.value })}
                              type="date"
                              className="adm-input"
                            />
                          </Field>
                          <div className="sm:col-span-2">
                            <Field label="Internal link (optional)" error={err('href')}>
                              <input
                                value={draft.href}
                                onChange={(e) => updateDraft(row.id, { href: e.target.value })}
                                placeholder="/fr/services/…"
                                className="adm-input"
                              />
                            </Field>
                          </div>
                          <div className="sm:col-span-2">
                            <Field label="Internal notes (never public)" error={err('notes')}>
                              <input
                                value={draft.notes}
                                onChange={(e) => updateDraft(row.id, { notes: e.target.value })}
                                className="adm-input"
                              />
                            </Field>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="inline-flex cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                checked={draft.active}
                                onChange={(e) => updateDraft(row.id, { active: e.target.checked })}
                                className="h-4 w-4 accent-majorelle-600"
                              />
                              <span className="text-sm font-medium text-ink-700">Enabled</span>
                            </label>
                          </div>
                          <div className="sm:col-span-2">
                            <button
                              onClick={() => save(row)}
                              disabled={savingId === row.id}
                              className="rounded-full bg-majorelle-600 px-5 py-2 text-sm font-semibold text-white hover:bg-majorelle-700 disabled:opacity-60"
                            >
                              {savingId === row.id ? 'Saving…' : 'Save campaign'}
                            </button>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase text-ink-500">Preview</p>
                          <div className="mt-2">
                            <CampaignPreview name={row.providerName} title={row.providerTitle} avatar={row.avatar} draft={draft} />
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null,
              ];
            })}
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-sm text-ink-400">
                  {loading ? 'Loading…' : 'No sponsored campaign yet. Use “New campaign” to create one.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink-700">{label}</span>
      <span className="mt-1 block">{children}</span>
      {error && <span className="mt-1 block text-xs font-medium text-clay-500">{error}</span>}
    </label>
  );
}

function StateBadge({ state }: { state: CampaignState }) {
  const styles: Record<CampaignState, string> = {
    ACTIVE: 'bg-zellige-500/10 text-zellige-600',
    SCHEDULED: 'bg-saffron-500/10 text-saffron-600',
    EXPIRED: 'bg-clay-400/10 text-clay-500',
    DISABLED: 'bg-ink-900/5 text-ink-500',
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[state]}`}>{state}</span>;
}

/**
 * Live preview of the placement card, exactly as it appears in the public
 * marketplace: cover image, provider name, the "Sponsorisé" transparency tag
 * and the call to action.
 */
function CampaignPreview({
  name,
  title,
  avatar,
  draft,
}: {
  name: string;
  title: string;
  avatar: string;
  draft: Draft;
}) {
  const image = draft.image.trim() || avatar;
  const initial = (name || '?').charAt(0).toUpperCase();
  return (
    <article className="flex w-[260px] flex-col overflow-hidden rounded-2xl border border-ink-900/[0.06] bg-white shadow-card">
      <div className="relative block aspect-[16/9] w-full overflow-hidden bg-sand-100">
        {image ? (
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center font-display text-4xl font-bold text-sunset-600/30">{initial}</div>
        )}
        <span className="absolute end-2 top-2 inline-flex shrink-0 items-center gap-1 rounded-full bg-ink-900/[0.06] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink-600">
          {MARKETING_MESSAGES.sponsoredTag}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate font-display text-[15.5px] font-semibold text-ink-900">{name}</h3>
        <p className="mt-0.5 truncate text-[12.5px] font-medium text-ink-500">{title}</p>
        <button
          type="button"
          className="mt-3.5 w-full rounded-full bg-sunset-500 px-4 py-2.5 text-xs font-semibold text-white shadow-sunset"
        >
          {MARKETING_MESSAGES.requestService}
        </button>
      </div>
    </article>
  );
}
