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
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState('');

  function load() {
    api.get<{ users: AdminUser[] }>(`/admin/users?q=${encodeURIComponent(q)}`).then((r) => setUsers(r.users));
  }
  useEffect(load, [q]);

  async function act(id: string, action: 'activate' | 'suspend' | 'ban') {
    await api.patch(`/admin/users/${id}`, { action });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Users</h1>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name or email…"
        className="mt-4 w-full max-w-sm rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none"
      />
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
