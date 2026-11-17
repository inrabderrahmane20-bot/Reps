'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { useAuth, ApiError } from '@/context/auth-context';

export default function LoginPage() {
  const t = useTranslations('auth');
  const common = useTranslations('common');
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const u = await login(email, password);
      if (u.role === 'admin') window.location.assign('/admin/');
      else router.push('/profile');
    } catch (err) {
      if(err instanceof ApiError && err.status===202)return;
      setError(t(err instanceof ApiError && err.status === 401 ? 'invalidCredentials' : err instanceof ApiError && err.status === 403 ? 'suspended' : 'unavailable'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 md:px-0">
      <h1 className="font-display text-2xl font-semibold text-ink-900">{t('loginTitle')}</h1>
      <p className="mt-1 text-sm text-ink-500">{t('loginSubtitle')}</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="login-email" className="text-xs font-semibold text-ink-700">{t('emailLabel')}</label>
          <input
            id="login-email"
            autoComplete="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="text-xs font-semibold text-ink-700">{t('passwordLabel')}</label>
          <input
            id="login-password"
            autoComplete="current-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none"
          />
        </div>
        {error && <p role="alert" className="text-sm text-clay-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-majorelle-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-majorelle-700 disabled:opacity-60"
        >
          {t('loginButton')}
        </button>
      </form>

      <Link href="/account-security" className="mt-4 text-sm underline">{t('recovery')}</Link>

      <p className="mt-6 text-center text-sm text-ink-500">
        {t('noAccount')}{' '}
        <Link href="/register" className="font-semibold text-majorelle-700 hover:underline">
          {common('register')}
        </Link>
      </p>
    </div>
  );
}
