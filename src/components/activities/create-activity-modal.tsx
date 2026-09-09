'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { api, ApiError } from '@/lib/api-client';

const CATEGORIES = ['Swimming', 'Football', 'Hiking', 'Running', 'Cycling', 'Photography', 'Gaming', 'Cultural visit'];

export function CreateActivityModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    date: '',
    location: '',
    max: 10,
    min: 2,
    visibility: 'public' as 'public' | 'private',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    setError(null);
    setSaving(true);
    try {
      await api.post('/activities', form);
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-ink-900">Create an activity</h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900">
            <X size={18} />
          </button>
        </div>
        <div className="mt-4 space-y-3">
          <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Activity title" className="w-full rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none" />
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="Description" className="w-full rounded-xl border border-ink-900/10 p-3 text-sm focus:border-majorelle-500 focus:outline-none" />
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button key={c} type="button" onClick={() => set('category', c)} className={`rounded-full px-2.5 py-1 text-xs font-medium ${form.category === c ? 'bg-clay-400 text-white' : 'bg-sand-100 text-ink-700 hover:bg-sand-200'}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.date} onChange={(e) => set('date', e.target.value)} placeholder="Sat · 18:00" className="rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none" />
            <input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Location" className="rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-ink-700">Min participants</label>
              <input type="number" min={1} value={form.min} onChange={(e) => set('min', Number(e.target.value))} className="mt-1 w-full rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-700">Max participants</label>
              <input type="number" min={1} value={form.max} onChange={(e) => set('max', Number(e.target.value))} className="mt-1 w-full rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-1.5">
            <button type="button" onClick={() => set('visibility', 'public')} className={`rounded-full px-3 py-1.5 text-xs font-medium ${form.visibility === 'public' ? 'bg-majorelle-600 text-white' : 'bg-sand-100 text-ink-700'}`}>
              Public
            </button>
            <button type="button" onClick={() => set('visibility', 'private')} className={`rounded-full px-3 py-1.5 text-xs font-medium ${form.visibility === 'private' ? 'bg-majorelle-600 text-white' : 'bg-sand-100 text-ink-700'}`}>
              Private (approval required)
            </button>
          </div>
          {error && <p className="text-sm text-clay-500">{error}</p>}
          <button onClick={submit} disabled={saving || !form.title || !form.description || !form.date || !form.location} className="w-full rounded-full bg-clay-400 px-4 py-2.5 text-sm font-semibold text-white hover:bg-clay-500 disabled:opacity-60">
            Create activity
          </button>
        </div>
      </div>
    </div>
  );
}
