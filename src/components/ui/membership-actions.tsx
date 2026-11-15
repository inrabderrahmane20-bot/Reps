'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api-client';
import { GroupChatPanel } from '@/components/chat/group-chat-panel';

export function MembershipActions({ kind, id, memberIds, closed = false }: { kind: 'activities' | 'communities'; id: string; memberIds: string[]; closed?: boolean }) {
  const { user } = useAuth();
  const router = useRouter();
  const common = useTranslations('common');
  const t = useTranslations(kind);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [chat, setChat] = useState(false);
  const joined = !!user && memberIds.includes(user.id);
  async function toggle() {
    if (!user) return router.push('/login');
    setBusy(true); setError(false);
    try { await api.post(`/${kind}/${id}/join`); router.refresh(); }
    catch { setError(true); }
    finally { setBusy(false); }
  }
  return <div className="space-y-3">
    <button disabled={busy || closed} onClick={() => void toggle()} className="w-full rounded-full bg-majorelle-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
      {joined ? common('leave') : t(kind === 'activities' ? 'joinActivity' : 'joinGroup')}
    </button>
    {error && <p role="alert" className="text-sm">{common('somethingWentWrong')}</p>}
    {kind === 'activities' && joined && <button onClick={() => setChat(!chat)} className="underline">{t('groupChat')}</button>}
    {chat && joined && user && <GroupChatPanel fetchUrl={`/activities/${id}/chat`} meId={user.id} />}
  </div>;
}
