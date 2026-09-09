'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

interface NewsRow {
  id: string;
  title: string;
  category: string;
  city: string;
  status: string;
  date: string;
}

const CATEGORIES = ['Local Life', 'Traffic', 'Transportation', 'Events', 'Culture', 'Sports', 'Employment', 'New Businesses', 'Announcements'];

export default function AdminNewsPage() {
  const [news, setNews] = useState<NewsRow[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', category: CATEGORIES[0], city: 'Marrakech', summary: '' });

  function load() {
    api.get<{ news: NewsRow[] }>('/admin/news').then((r) => setNews(r.news));
  }
  useEffect(load, []);

  async function create() {
    await api.post('/admin/news', form);
    setForm({ title: '', category: CATEGORIES[0], city: 'Marrakech', summary: '' });
    setShowCreate(false);
    load();
  }

  async function toggleStatus(id: string, status: string) {
    await api.patch(`/admin/news/${id}`, { status: status === 'published' ? 'draft' : 'published' });
    load();
  }

  async function remove(id: string) {
    await api.delete(`/admin/news/${id}`);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">News</h1>
        <button onClick={() => setShowCreate((s) => !s)} className="rounded-full bg-majorelle-600 px-4 py-2 text-sm font-semibold text-white hover:bg-majorelle-700">
          {showCreate ? 'Cancel' : 'New article'}
        </button>
      </div>

      {showCreate && (
        <div className="mt-4 max-w-lg space-y-2 rounded-2xl bg-white p-4 shadow-card">
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Title" className="w-full rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm" />
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm">
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <textarea value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} rows={3} placeholder="Summary / content" className="w-full rounded-xl border border-ink-900/10 p-3 text-sm" />
          <button onClick={create} disabled={!form.title || !form.summary} className="rounded-full bg-majorelle-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            Publish
          </button>
        </div>
      )}

      <div className="mt-6 space-y-2">
        {news.map((n) => (
          <div key={n.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-card">
            <div>
              <p className="text-sm font-semibold">{n.title}</p>
              <p className="text-xs text-ink-500">
                {n.category} · {n.city} · {new Date(n.date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button onClick={() => toggleStatus(n.id, n.status)} className="rounded-full border border-ink-900/10 px-3 py-1.5 text-xs font-semibold hover:bg-sand-100">
                {n.status === 'published' ? 'Unpublish' : 'Publish'}
              </button>
              <button onClick={() => remove(n.id)} className="rounded-full bg-clay-400 px-3 py-1.5 text-xs font-semibold text-white hover:bg-clay-500">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
