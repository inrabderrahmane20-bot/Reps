'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Smile, Image as ImageIcon, Send, Minus, Square } from 'lucide-react';

export interface MsnContact {
  id: string;
  name: string;
  status: 'online' | 'away' | 'offline';
}

export interface MsnMessage {
  id: string;
  authorName: string;
  content: string;
  me: boolean;
}

const statusColor: Record<'online' | 'away' | 'offline', string> = {
  online: 'bg-zellige-500',
  away: 'bg-saffron-500',
  offline: 'bg-ink-300',
};

// Deliberately nostalgic MSN-Messenger-inspired chat window (SRS §33-34),
// used only inside the Meetings section (rooms + accepted private conversations).
export function MsnChatRoom({
  title,
  contacts,
  messages,
  onSend,
}: {
  title: string;
  contacts: MsnContact[];
  messages: MsnMessage[];
  onSend: (content: string) => void;
}) {
  const t = useTranslations('meetings');
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  function send() {
    if (!draft.trim()) return;
    onSend(draft);
    setDraft('');
  }

  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-majorelle-800/20 shadow-[0_20px_50px_-20px_rgba(27,63,139,0.45)]">
      <div className="flex items-center justify-between bg-gradient-to-r from-majorelle-600 to-majorelle-500 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-saffron-400" />
          <span className="text-sm font-semibold text-white">{title}</span>
        </div>
        <div className="flex items-center gap-1.5 text-majorelle-100">
          <Minus size={14} />
          <Square size={12} />
        </div>
      </div>

      <div className="flex h-80 bg-sand-50 sm:h-96">
        <aside className="hidden w-40 shrink-0 border-e border-ink-900/10 bg-white p-3 sm:block">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-300">Contacts</p>
          <ul className="space-y-2.5">
            {contacts.map((c) => (
              <li key={c.id} className="flex items-center gap-2 text-sm text-ink-700">
                <span className={`h-2 w-2 shrink-0 rounded-full ${statusColor[c.status]}`} />
                {c.name}
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex flex-1 flex-col">
          <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
            {messages.length === 0 && <p className="text-center text-xs text-ink-300">No messages yet — say hello!</p>}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.me ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${m.me ? 'rounded-ee-sm bg-majorelle-600 text-white' : 'rounded-ss-sm bg-white text-ink-900'}`}>
                  {!m.me && <p className="mb-0.5 text-[11px] font-semibold text-majorelle-700">{m.authorName}</p>}
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="flex items-center gap-2 border-t border-ink-900/10 bg-white px-3 py-2.5">
            <button type="button" aria-label="Emoji" className="text-ink-300 hover:text-saffron-500">
              <Smile size={18} />
            </button>
            <button type="button" aria-label="Attach image" className="text-ink-300 hover:text-majorelle-600">
              <ImageIcon size={18} />
            </button>
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={t('typeYourMessage') || 'Type your message…'}
              className="flex-1 rounded-full bg-sand-100 px-3.5 py-1.5 text-sm outline-none placeholder:text-ink-300"
            />
            <button
              type="button"
              onClick={send}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-majorelle-600 text-white hover:bg-majorelle-700"
              aria-label="Send"
            >
              <Send size={14} className="flip-rtl" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
