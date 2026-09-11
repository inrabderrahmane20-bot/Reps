'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

interface AdminActivity {
  id: string;
  title: string;
  category: string;
  description: string;
  date: string;
  location: string;
  city: string;
  lat: number;
  lng: number;
  max: number;
  min: number;
  level: string;
  visibility: string;
  status: string;
  participants: number;
  zoneId?: string;
}

const EMPTY = {
  title: '',
  category: '',
  description: '',
  date: '',
  location: 'Medina',
  city: 'Marrakech',
  lat: '',
  lng: '',
  max: '10',
  min: '2',
  level: 'All levels',
  visibility: 'public',
  status: 'open',
};

export default function AdminActivitiesPage() {
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [q, setQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>(EMPTY);

  function load() {
    api.get<{ activities: AdminActivity[] }>(`/admin/activities?q=${encodeURIComponent(q)}`).then((r) => setActivities(r.activities));
  }
  useEffect(load, [q]);

  function resetForm() {
    setForm(EMPTY);
    setEditingId(null);
  }

  function openCreate() {
    resetForm();
    setShowForm(true);
  }

  function openEdit(a: AdminActivity) {
    setEditingId(a.id);
    setForm({
      title: a.title,
      category: a.category,
      description: a.description,
      date: a.date,
      location: a.location,
      city: a.city,
      lat: String(a.lat ?? ''),
      lng: String(a.lng ?? ''),
      max: String(a.max ?? 10),
      min: String(a.min ?? 2),
      level: a.level || 'All levels',
      visibility: a.visibility,
      status: a.status,
    });
    setShowForm(true);
  }

  async function save() {
    const payload = {
      ...form,
      lat: form.lat ? Number(form.lat) : undefined,
      lng: form.lng ? Number(form.lng) : undefined,
      max: Number(form.max),
      min: Number(form.min),
      equipment: [],
    };
    if (editingId) {
      await api.patch(`/admin/activities/${editingId}`, payload);
    } else {
      await api.post('/admin/activities', payload);
    }
    setShowForm(false);
    resetForm();
    load();
  }

  async function setStatus(a: AdminActivity, status: string) {
    await api.patch(`/admin/activities/${a.id}`, { status });
    load();
  }

  async function remove(a: AdminActivity) {
    if (!confirm(`Delete activity "${a.title}"?`)) return;
    await api.delete(`/admin/activities/${a.id}`);
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Activities</h1>
        <button onClick={openCreate} className="rounded-full bg-majorelle-600 px-4 py-2 text-sm font-semibold text-white hover:bg-majorelle-700">
          New activity
        </button>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by title, category or location…"
        className="mt-4 w-full max-w-sm rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none"
      />

      {showForm && (
        <div className="mt-4 grid max-w-2xl grid-cols-1 gap-3 rounded-2xl bg-white p-4 shadow-card sm:grid-cols-2">
          <Field label="Title">
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="adm-input" />
          </Field>
          <Field label="Category">
            <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="adm-input" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="adm-input" />
            </Field>
          </div>
          <Field label="Date">
            <input value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} placeholder="Sat · 18:00" className="adm-input" />
          </Field>
          <Field label="Neighborhood / location">
            <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="adm-input" />
          </Field>
          <Field label="City">
            <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="adm-input" />
          </Field>
          <Field label="Level">
            <input value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} className="adm-input" />
          </Field>
          <Field label="Latitude">
            <input value={form.lat} onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))} placeholder="31.6295" className="adm-input" />
          </Field>
          <Field label="Longitude">
            <input value={form.lng} onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))} placeholder="-8.0089" className="adm-input" />
          </Field>
          <Field label="Max participants">
            <input value={form.max} onChange={(e) => setForm((f) => ({ ...f, max: e.target.value }))} type="number" className="adm-input" />
          </Field>
          <Field label="Min participants">
            <input value={form.min} onChange={(e) => setForm((f) => ({ ...f, min: e.target.value }))} type="number" className="adm-input" />
          </Field>
          <Field label="Visibility">
            <select value={form.visibility} onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value }))} className="adm-input">
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="adm-input">
              <option value="open">Open</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </Field>
          <div className="flex gap-2 sm:col-span-2">
            <button onClick={save} disabled={!form.title || !form.category || !form.date || !form.location} className="rounded-full bg-majorelle-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {editingId ? 'Save changes' : 'Create activity'}
            </button>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="rounded-full border border-ink-900/10 px-5 py-2 text-sm font-semibold text-ink-700 hover:bg-sand-100">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-900/5 text-start text-xs font-semibold uppercase text-ink-500">
              <th className="p-3 text-start">Title</th>
              <th className="p-3 text-start">Category</th>
              <th className="p-3 text-start">Location</th>
              <th className="p-3 text-start">When</th>
              <th className="p-3 text-start">Zone</th>
              <th className="p-3 text-start">Participants</th>
              <th className="p-3 text-start">Status</th>
              <th className="p-3 text-start">Actions</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a) => (
              <tr key={a.id} className="border-b border-ink-900/5 last:border-0">
                <td className="p-3 font-medium">{a.title}</td>
                <td className="p-3 text-ink-500">{a.category}</td>
                <td className="p-3 text-ink-500">{a.location}</td>
                <td className="p-3 text-ink-500">{a.date}</td>
                <td className="p-3 text-ink-500">{a.zoneId || '—'}</td>
                <td className="p-3 text-ink-500">
                  {a.participants}
                </td>
                <td className="p-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${a.status === 'open' ? 'bg-zellige-500/10 text-zellige-600' : a.status === 'completed' ? 'bg-majorelle-600/10 text-majorelle-700' : 'bg-clay-400/10 text-clay-500'}`}>
                    {a.status}
                  </span>
                </td>
                <td className="space-x-2 p-3">
                  <button onClick={() => setStatus(a, 'cancelled')} className="text-xs font-semibold text-clay-500 hover:underline">
                    Cancel
                  </button>
                  <button onClick={() => openEdit(a)} className="text-xs font-semibold text-majorelle-700 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => remove(a)} className="text-xs font-semibold text-ink-500 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {activities.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-sm text-ink-400">
                  No activities match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink-700">{label}</span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}