'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { BadgeCheck, Clock, XCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { api, ApiError } from '@/lib/api-client';

interface ServiceRequestRow {
  id: string;
  providerName: string;
  providerCategory?: string;
  category: string;
  description: string;
  location: string;
  date: string;
  status: string;
  providerId: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { user, loading, setUser } = useAuth();
  const router = useRouter();
  const t = useTranslations('profile');
  const common = useTranslations('common');
  const providerT = useTranslations('provider');

  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState('');
  const [saving, setSaving] = useState(false);

  const [applying, setApplying] = useState(false);
  const [requests, setRequests] = useState<ServiceRequestRow[]>([]);
  const [reviewFor, setReviewFor] = useState<ServiceRequestRow | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      setBio(user.bio || '');
      setInterests((user.interests || []).join(', '));
      api.get<{ requests: ServiceRequestRow[] }>('/requests?role=client').then((r) => setRequests(r.requests)).catch(() => {});
    }
  }, [user]);

  if (loading || !user) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-ink-500">{common('loading')}</div>;
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await api.patch<{ user: typeof user }>('/users/me', {
        bio,
        interests: interests.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setUser(res.user);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function markComplete(id: string) {
    await api.patch(`/requests/${id}`, { status: 'completed' });
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'completed' } : r)));
  }

  async function cancelRequest(id: string) {
    await api.patch(`/requests/${id}`, { status: 'cancelled' });
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r)));
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
      <div className="flex items-center gap-4">
        <img src={user.avatar} alt="" className="h-20 w-20 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-sm text-ink-500">
            {user.city}
            {user.neighborhood ? ` · ${user.neighborhood}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing((e) => !e)}
          className="shrink-0 rounded-full border border-ink-900/10 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-sand-100"
        >
          {common('edit')}
        </button>
      </div>

      {editing && (
        <div className="mt-6 space-y-3 rounded-2xl bg-white p-4 shadow-card">
          <div>
            <label className="text-xs font-semibold text-ink-700">{t('bio')}</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-ink-900/10 p-3 text-sm focus:border-majorelle-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-700">{t('interests')}</label>
            <input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Swimming, Photography, Travel" className="mt-1 w-full rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none" />
          </div>
          <button onClick={saveProfile} disabled={saving} className="rounded-full bg-majorelle-600 px-5 py-2 text-sm font-semibold text-white hover:bg-majorelle-700 disabled:opacity-60">
            {common('saveChanges')}
          </button>
        </div>
      )}

      {!editing && (
        <div className="mt-6 rounded-2xl bg-white p-4 shadow-card">
          {user.bio ? <p className="text-sm text-ink-700">{user.bio}</p> : <p className="text-sm text-ink-300">No bio yet.</p>}
          {user.interests.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {user.interests.map((i) => (
                <span key={i} className="rounded-full bg-sand-100 px-2.5 py-1 text-xs font-medium text-ink-700">
                  {i}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Provider status / application */}
      <div className="mt-6 rounded-2xl bg-white p-4 shadow-card">
        {user.providerStatus === 'none' && !applying && (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-base font-semibold text-ink-900">{t('becomeProviderCta')}</p>
              <p className="mt-1 max-w-lg text-sm text-ink-500">{t('becomeProviderDesc')}</p>
            </div>
            <button
              onClick={() => setApplying(true)}
              className="shrink-0 rounded-full bg-clay-400 px-5 py-2.5 text-sm font-semibold text-white hover:bg-clay-500"
            >
              {common('becomeProvider')}
            </button>
          </div>
        )}

        {user.providerStatus === 'pending' && (
          <div className="flex items-center gap-3 text-saffron-600">
            <Clock size={18} />
            <p className="text-sm font-medium">{t('providerPendingNotice')}</p>
          </div>
        )}

        {user.providerStatus === 'approved' && (
          <div className="flex items-center gap-3 text-zellige-600">
            <BadgeCheck size={18} />
            <p className="text-sm font-medium">You are a verified provider. Manage requests from your provider dashboard.</p>
          </div>
        )}

        {user.providerStatus === 'rejected' && !applying && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 text-clay-500">
              <XCircle size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">{t('providerRejectedNotice')}</p>
                {user.provider?.rejectionReason && (
                  <p className="mt-1 text-xs text-ink-500">
                    {providerT('rejectionReason')}: {user.provider.rejectionReason}
                  </p>
                )}
              </div>
            </div>
            <button onClick={() => setApplying(true)} className="shrink-0 rounded-full bg-clay-400 px-5 py-2.5 text-sm font-semibold text-white hover:bg-clay-500">
              {providerT('resubmit')}
            </button>
          </div>
        )}

        {applying && (
          <ProviderApplicationForm
            initial={user.provider}
            onDone={(updatedUser) => {
              setUser(updatedUser);
              setApplying(false);
            }}
            onCancel={() => setApplying(false)}
          />
        )}
      </div>

      {/* My service requests */}
      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-ink-900">{t('myRequests')}</h2>
        {requests.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">No service requests yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="rounded-2xl bg-white p-4 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">
                      {r.category} — {r.providerName}
                    </p>
                    <p className="text-xs text-ink-500">
                      {r.location} · {r.date}
                    </p>
                  </div>
                  <StatusPill status={r.status} />
                </div>
                <p className="mt-2 text-sm text-ink-700">{r.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.status === 'pending' && (
                    <button onClick={() => cancelRequest(r.id)} className="rounded-full border border-ink-900/10 px-3.5 py-1.5 text-xs font-semibold text-ink-700 hover:bg-sand-100">
                      {common('cancel')}
                    </button>
                  )}
                  {r.status === 'accepted' && (
                    <button onClick={() => markComplete(r.id)} className="rounded-full bg-zellige-500 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-zellige-600">
                      {providerT('markComplete')}
                    </button>
                  )}
                  {r.status === 'completed' && (
                    <button onClick={() => setReviewFor(r)} className="rounded-full bg-majorelle-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-majorelle-700">
                      Leave a review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reviewFor && <ReviewModal request={reviewFor} onClose={() => setReviewFor(null)} />}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-saffron-500/10 text-saffron-600',
    accepted: 'bg-majorelle-600/10 text-majorelle-700',
    refused: 'bg-clay-400/10 text-clay-500',
    completed: 'bg-zellige-500/10 text-zellige-600',
    cancelled: 'bg-ink-900/5 text-ink-500',
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] || ''}`}>{status}</span>;
}

function ProviderApplicationForm({
  initial,
  onDone,
  onCancel,
}: {
  initial: any;
  onDone: (u: any) => void;
  onCancel: () => void;
}) {
  const t = useTranslations('provider');
  const common = useTranslations('common');
  const [form, setForm] = useState({
    category: initial?.category || '',
    title: initial?.title || '',
    description: initial?.description || '',
    specialties: (initial?.specialties || []).join(', '),
    serviceArea: initial?.serviceArea || '',
    priceRange: initial?.priceRange || '',
    documents: (initial?.documents || []).join(', '),
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    setError(null);
    setSaving(true);
    try {
      const res = await api.post<{ user: any }>('/providers/apply', {
        ...form,
        specialties: form.specialties.split(',').map((s) => s.trim()).filter(Boolean),
        documents: form.documents.split(',').map((s) => s.trim()).filter(Boolean),
      });
      onDone(res.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h3 className="font-display text-base font-semibold text-ink-900">{t('applyTitle')}</h3>
      <p className="mt-1 text-sm text-ink-500">{t('applySubtitle')}</p>
      <div className="mt-4 space-y-3">
        <div>
          <label className="text-xs font-semibold text-ink-700">{t('categoryLabel')}</label>
          <input value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Plumbing, Electricity, Cleaning…" className="mt-1 w-full rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-700">{t('titleLabel')}</label>
          <input value={form.title} onChange={(e) => set('title', e.target.value)} className="mt-1 w-full rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-700">{t('descriptionLabel')}</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-ink-900/10 p-3 text-sm focus:border-majorelle-500 focus:outline-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-700">{t('specialtiesLabel')}</label>
          <input value={form.specialties} onChange={(e) => set('specialties', e.target.value)} className="mt-1 w-full rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-ink-700">{t('serviceAreaLabel')}</label>
            <input value={form.serviceArea} onChange={(e) => set('serviceArea', e.target.value)} className="mt-1 w-full rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-700">{t('priceRangeLabel')}</label>
            <input value={form.priceRange} onChange={(e) => set('priceRange', e.target.value)} className="mt-1 w-full rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-700">{t('documentsLabel')}</label>
          <input value={form.documents} onChange={(e) => set('documents', e.target.value)} placeholder="id_card.pdf, certificate.pdf" className="mt-1 w-full rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none" />
        </div>
        {error && <p className="text-sm text-clay-500">{error}</p>}
        <div className="flex gap-2">
          <button onClick={submit} disabled={saving} className="rounded-full bg-clay-400 px-5 py-2.5 text-sm font-semibold text-white hover:bg-clay-500 disabled:opacity-60">
            {t('submitApplication')}
          </button>
          <button onClick={onCancel} className="rounded-full border border-ink-900/10 px-5 py-2.5 text-sm font-semibold text-ink-700 hover:bg-sand-100">
            {common('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewModal({ request, onClose }: { request: ServiceRequestRow; onClose: () => void }) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    try {
      await api.post('/reviews', { requestId: request.id, rating, content });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-lg font-semibold text-ink-900">Rate {request.providerName}</h3>
        {sent ? (
          <p className="mt-4 text-sm text-ink-700">Thanks for your review!</p>
        ) : (
          <>
            <div className="mt-3 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)} className={`text-2xl ${n <= rating ? 'text-saffron-500' : 'text-ink-300'}`}>
                  ★
                </button>
              ))}
            </div>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} placeholder="How did it go?" className="mt-3 w-full rounded-xl border border-ink-900/10 p-3 text-sm focus:border-majorelle-500 focus:outline-none" />
            {error && <p className="mt-2 text-xs text-clay-500">{error}</p>}
            <button onClick={submit} className="mt-3 w-full rounded-full bg-majorelle-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-majorelle-700">
              Submit review
            </button>
          </>
        )}
      </div>
    </div>
  );
}
