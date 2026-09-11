'use client';

import { useState } from 'react';

// Inline login for the /admin surface. Rendered by the admin root layout when
// no admin session exists, so typing /admin directly keeps working instead of
// redirecting through the localized /login page and losing the destination.
export function AdminLogin({ signedInNonAdmin }: { signedInNonAdmin?: boolean }) {
  const [email, setEmail] = useState('admin@medina.ma');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(signedInNonAdmin ? 'Signed in, but this account is not an administrator.' : null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Login failed. Check your credentials.');
        return;
      }
      if (data.user?.role !== 'admin') {
        setError('This account does not have administrator access.');
        return;
      }
      window.location.href = '/admin';
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="font-display text-2xl font-semibold text-ink-900">Medina Admin</p>
          <p className="mt-1 text-sm text-ink-500">Sign in as an administrator</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
          <div>
            <label className="text-xs font-semibold text-ink-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-clay-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-majorelle-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-majorelle-700 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}