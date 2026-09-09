'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { api, ApiError } from '@/lib/api-client';

const CATEGORIES = ['Family', 'Education', 'Hobbies', 'Lifestyle', 'Local'];

export function CreateCommunityModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setError(null);
    setSaving(true);
    try {
      await api.post('/communities', { name, description, category });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-ink-900">Create a community</h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900">
            <X size={18} />
          </button>
        </div>
        <div className="mt-4 space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" className="w-full rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What is this group about?" className="w-full rounded-xl border border-ink-900/10 p-3 text-sm focus:border-majorelle-500 focus:outline-none" />
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button key={c} type="button" onClick={() => setCategory(c)} className={`rounded-full px-2.5 py-1 text-xs font-medium ${category === c ? 'bg-zellige-500 text-white' : 'bg-sand-100 text-ink-700 hover:bg-sand-200'}`}>
                {c}
              </button>
            ))}
          </div>
          {error && <p className="text-sm text-clay-500">{error}</p>}
          <button onClick={submit} disabled={saving || !name || !description} className="w-full rounded-full bg-majorelle-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-majorelle-700 disabled:opacity-60">
            Create group
          </button>
        </div>
      </div>
    </div>
  );
}
