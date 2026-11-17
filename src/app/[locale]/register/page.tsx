'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import { useAuth, ApiError } from '@/context/auth-context';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const common = useTranslations('common');
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', city: 'Marrakech', neighborhood: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(form);
      router.push('/profile');
    } catch (err) {
      if(err instanceof ApiError && err.status===202)return;
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 md:px-0">
      <h1 className="font-display text-2xl font-semibold text-ink-900">{t('registerTitle')}</h1>
      <p className="mt-1 text-sm text-ink-500">{t('registerSubtitle')}</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="register-firstName" className="text-xs font-semibold text-ink-700">{t('firstNameLabel')}</label>
            <input required id="register-firstName" autoComplete="given-name" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} className="mt-1 w-full rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none" />
          </div>
          <div>
            <label htmlFor="register-lastName" className="text-xs font-semibold text-ink-700">{t('lastNameLabel')}</label>
            <input required id="register-lastName" autoComplete="family-name" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} className="mt-1 w-full rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none" />
          </div>
        </div>
        <div>
          <label htmlFor="register-email" className="text-xs font-semibold text-ink-700">{t('emailLabel')}</label>
          <input type="email" required id="register-email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="mt-1 w-full rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none" />
        </div>
        <div>
          <label htmlFor="register-password" className="text-xs font-semibold text-ink-700">{t('passwordLabel')}</label>
          <input type="password" required minLength={12} maxLength={128} id="register-password" autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)} className="mt-1 w-full rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="register-city" className="text-xs font-semibold text-ink-700">{t('cityLabel')}</label>
            <input id="register-city" autoComplete="address-level2" value={form.city} onChange={(e) => set('city', e.target.value)} className="mt-1 w-full rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none" />
          </div>
          <div>
            <label htmlFor="register-neighborhood" className="text-xs font-semibold text-ink-700">{t('neighborhoodLabel')}</label>
            <input id="register-neighborhood" autoComplete="address-level3" value={form.neighborhood} onChange={(e) => set('neighborhood', e.target.value)} className="mt-1 w-full rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none" />
          </div>
        </div>
        {error && <p role="alert" className="text-sm text-clay-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-majorelle-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-majorelle-700 disabled:opacity-60"
        >
          {t('registerButton')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        {t('haveAccount')}{' '}
        <Link href="/login" className="font-semibold text-majorelle-700 hover:underline">
          {common('login')}
        </Link>
      </p>
    </div>
  );
}
