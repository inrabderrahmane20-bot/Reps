'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Send } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';

interface ConversationRow {
  id: string;
  otherUser: { id: string; name: string; avatar: string } | null;
  lastMessage: string | null;
  lastMessageAt: string;
  unread: number;
}
interface MessageRow {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export default function MessagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations('messagesPage');
  const common = useTranslations('common');

  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  function loadConversations() {
    api.get<{ conversations: ConversationRow[] }>('/conversations?type=direct').then((r) => {
      setConversations(r.conversations);
      if (!activeId && r.conversations.length) setActiveId(r.conversations[0].id);
    });
  }
  useEffect(() => {
    if (user) loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  function loadMessages(id: string) {
    api.get<{ messages: MessageRow[] }>(`/conversations/${id}/messages`).then((r) => setMessages(r.messages));
  }
  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);
    const interval = setInterval(() => loadMessages(activeId), 4000);
    return () => clearInterval(interval);
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send() {
    if (!draft.trim() || !activeId) return;
    setDraft('');
    await api.post(`/conversations/${activeId}/messages`, { content: draft });
    loadMessages(activeId);
    loadConversations();
  }

  if (loading || !user) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-sm text-ink-500">{common('loading')}</div>;

  const active = conversations.find((c) => c.id === activeId);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <h1 className="font-display text-2xl font-semibold text-ink-900">{t('title')}</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 rounded-2xl bg-white shadow-card md:grid-cols-3">
        <aside className="max-h-[32rem] overflow-y-auto border-e border-ink-900/5 p-2 md:col-span-1">
          {conversations.length === 0 && <p className="p-4 text-center text-sm text-ink-500">{t('empty')}</p>}
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`flex w-full items-center gap-2.5 rounded-xl p-2.5 text-start hover:bg-sand-100 ${activeId === c.id ? 'bg-sand-100' : ''}`}
            >
              {c.otherUser?.avatar && <img src={c.otherUser.avatar} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-semibold text-ink-900">{c.otherUser?.name}</p>
                  {c.unread > 0 && <span className="ms-1 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-clay-500 text-[9px] font-bold text-white">{c.unread}</span>}
                </div>
                {c.lastMessage && <p className="truncate text-xs text-ink-500">{c.lastMessage}</p>}
              </div>
            </button>
          ))}
        </aside>

        <div className="flex h-[32rem] flex-col md:col-span-2">
          {!active ? (
            <div className="flex flex-1 items-center justify-center text-sm text-ink-500">{t('selectConversation')}</div>
          ) : (
            <>
              <div className="border-b border-ink-900/5 p-3">
                <p className="text-sm font-semibold text-ink-900">{active.otherUser?.name}</p>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${m.senderId === user.id ? 'bg-majorelle-600 text-white' : 'bg-sand-100 text-ink-900'}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="flex items-center gap-2 border-t border-ink-900/5 p-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder={t('typeMessage')}
                  className="flex-1 rounded-full border border-ink-900/10 px-3.5 py-2 text-sm focus:border-majorelle-500 focus:outline-none"
                />
                <button onClick={send} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-majorelle-600 text-white hover:bg-majorelle-700">
                  <Send size={15} className="flip-rtl" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
