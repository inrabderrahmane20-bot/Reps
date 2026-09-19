'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { api, ApiError } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { useRouter } from '@/i18n/navigation';

export function RequestServiceModal({
  providerId,
  category,
  onClose,
}: {
  providerId: string;
  category: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations('requestFlow');
  const common = useTranslations('common');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(user?.neighborhood || '');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Escape closes the modal.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit() {
    if (!user) {
      router.push('/login');
      return;
    }
    setError(null);
    setStatus('sending');
    try {
      await api.post('/requests', { providerId, category, description, location, date });
      setStatus('sent');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
      setStatus('idle');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-ink-900">{t('title')}</h3>
          <button onClick={onClose} aria-label={common('close')} className="text-ink-500 hover:text-ink-900">
            <X size={18} />
          </button>
        </div>

        {status === 'sent' ? (
          <p className="mt-4 text-sm text-ink-700">{t('requestSentTitle')} You'll be notified when the provider responds.</p>
        ) : (
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-ink-700">{t('descriptionLabel')}</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-ink-900/10 p-3 text-sm focus:border-majorelle-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-700">{t('locationLabel')}</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 w-full rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-700">{t('dateLabel')}</label>
              <input value={date} onChange={(e) => setDate(e.target.value)} placeholder="Tomorrow 10am" className="mt-1 w-full rounded-xl border border-ink-900/10 px-3.5 py-2.5 text-sm focus:border-majorelle-500 focus:outline-none" />
            </div>
            {error && <p className="text-sm text-clay-500">{error}</p>}
            <button
              onClick={submit}
              disabled={status === 'sending' || !description || !location || !date}
              className="w-full rounded-full bg-majorelle-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-majorelle-700 disabled:opacity-60"
            >
              {t('sendRequest')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
