'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Flag, X } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';

export function ReportButton({
  targetType,
  targetId,
  className,
}: {
  targetType: 'user' | 'provider' | 'community' | 'activity' | 'post' | 'message' | 'room';
  targetId: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('common');

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? 'inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-clay-500'}
      >
        <Flag size={13} /> {t('report')}
      </button>
      {open && <ReportModal targetType={targetType} targetId={targetId} onClose={() => setOpen(false)} />}
    </>
  );
}

function ReportModal({
  targetType,
  targetId,
  onClose,
}: {
  targetType: string;
  targetId: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const t = useTranslations('common');
  const m = useTranslations('modals');
  const REASONS = [
    m('reasonSpam'), m('reasonHarassment'), m('reasonFakeProfile'), m('reasonFraud'),
    m('reasonInappropriate'), m('reasonIllegal'), m('reasonHate'), m('reasonSexual'),
    m('reasonScam'), m('reasonOther'),
  ];
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function submit() {
    if (!user) {
      setStatus('error');
      return;
    }
    setStatus('sending');
    try {
      await api.post('/reports', { targetType, targetId, reason, details });
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-ink-900">{m('reportTitle')}</h3>
          <button onClick={onClose} aria-label={t('close')} className="text-ink-500 hover:text-ink-900">
            <X size={18} />
          </button>
        </div>

        {status === 'sent' ? (
          <p className="mt-4 text-sm text-ink-700">{m('reportThanks')}</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-ink-500">{m('reportWhy')}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    reason === r ? 'bg-clay-400 text-white' : 'bg-sand-100 text-ink-700 hover:bg-sand-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={m('reportDetailsPlaceholder')}
              rows={3}
              className="mt-3 w-full rounded-xl border border-ink-900/10 p-3 text-sm focus:border-majorelle-500 focus:outline-none"
            />
            {status === 'error' && (
              <p className="mt-2 text-xs text-clay-500">
                {user ? t('somethingWentWrong') : m('reportSignInRequired')}
              </p>
            )}
            <button
              type="button"
              onClick={submit}
              disabled={status === 'sending'}
              className="mt-3 w-full rounded-full bg-majorelle-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-majorelle-700 disabled:opacity-60"
            >
              {m('reportSubmit')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
