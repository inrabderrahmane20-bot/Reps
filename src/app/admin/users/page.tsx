'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  city: string;
  neighborhood?: string;
  createdAt: string;
}

const EMPTY = { firstName: '', lastName: '', email: '', password: '', city: 'Marrakech', neighborhood: '', role: 'user', status: 'active' };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>(EMPTY);

  function load() {
    api.get<{ users: AdminUser[] }>(`/admin/users?q=${encodeURIComponent(q)}`).then((r) => setUsers(r.users));
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

  function openEdit(u: AdminUser) {
    setEditingId(u.id);
    setForm({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      password: '',
      city: u.city,
      neighborhood: u.neighborhood || '',
      role: u.role,
      status: u.status,
    });
    setShowForm(true);
  }

  async function save() {
    if (editingId) {
      await api.patch(`/admin/users/${editingId}`, { ...form, password: form.password || undefined });
    } else {
      await api.post('/admin/users', form);
    }
    setShowForm(false);
    resetForm();
    load();
  }

  async function act(id: string, action: 'activate' | 'suspend' | 'ban') {
    await api.patch(`/admin/users/${id}`, { action });
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Users</h1>
        <button onClick={openCreate} className="rounded-full bg-majorelle-600 px-4 py-2 text-sm font-semibold text-white hover:bg-majorelle-700">
          New user
        </button>
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name or email…"
        className="mt-4 w-full max-w-sm rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none"
      />

      {showForm && (
        <div className="mt-4 grid max-w-2xl grid-cols-1 gap-3 rounded-2xl bg-white p-4 shadow-card sm:grid-cols-2">
          <UserField label="First name">
            <input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className="adm-input" />
          </UserField>
          <UserField label="Last name">
            <input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className="adm-input" />
          </UserField>
          <UserField label="Email">
            <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} type="email" className="adm-input" />
          </UserField>
          <UserField label="Password (leave blank to keep)">
            <input value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} type="password" className="adm-input" />
          </UserField>
          <UserField label="City">
            <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="adm-input" />
          </UserField>
          <UserField label="Neighborhood">
            <input value={form.neighborhood} onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))} className="adm-input" />
          </UserField>
          <UserField label="Role">
            <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="adm-input">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </UserField>
          <UserField label="Status">
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="adm-input">
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </UserField>
          <div className="flex gap-2 sm:col-span-2">
            <button onClick={save} disabled={!form.firstName || !form.lastName || !form.email} className="rounded-full bg-majorelle-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {editingId ? 'Save changes' : 'Create user'}
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
              <th className="p-3 text-start">Name</th>
              <th className="p-3 text-start">Email</th>
              <th className="p-3 text-start">City</th>
              <th className="p-3 text-start">Role</th>
              <th className="p-3 text-start">Status</th>
              <th className="p-3 text-start">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-ink-900/5 last:border-0">
                <td className="p-3 font-medium">
                  {u.firstName} {u.lastName}
                </td>
                <td className="p-3 text-ink-500">{u.email}</td>
                <td className="p-3 text-ink-500">{u.city}</td>
                <td className="p-3 text-ink-500">{u.role}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      u.status === 'active' ? 'bg-zellige-500/10 text-zellige-600' : u.status === 'suspended' ? 'bg-saffron-500/10 text-saffron-600' : 'bg-clay-400/10 text-clay-500'
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="space-x-2 p-3">
                  <button onClick={() => openEdit(u)} className="text-xs font-semibold text-majorelle-700 hover:underline">
                    Edit
                  </button>
                  {u.status !== 'active' && (
                    <button onClick={() => act(u.id, 'activate')} className="text-xs font-semibold text-zellige-600 hover:underline">
                      Activate
                    </button>
                  )}
                  {u.status !== 'suspended' && u.role !== 'admin' && (
                    <button onClick={() => act(u.id, 'suspend')} className="text-xs font-semibold text-saffron-600 hover:underline">
                      Suspend
                    </button>
                  )}
                  {u.status !== 'banned' && u.role !== 'admin' && (
                    <button onClick={() => act(u.id, 'ban')} className="text-xs font-semibold text-clay-500 hover:underline">
                      Ban
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink-700">{label}</span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}