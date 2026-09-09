'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api-client';

interface Msg {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

// Simple modern group chat panel, used for activity discussions (SRS §95).
// Distinct from the retro MSN-style Meetings rooms (see msn-chat-room.tsx).
export function GroupChatPanel({ fetchUrl, meId }: { fetchUrl: string; meId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [content, setContent] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  function load() {
    api.get<{ messages: Msg[] }>(fetchUrl).then((r) => setMessages(r.messages));
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUrl]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send() {
    if (!content.trim()) return;
    setContent('');
    await api.post(fetchUrl, { content });
    load();
  }

  return (
    <div className="flex h-80 flex-col rounded-2xl bg-white shadow-card">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && <p className="text-center text-xs text-ink-300">No messages yet — say hello!</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.senderId === meId ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.senderId === meId ? 'bg-majorelle-600 text-white' : 'bg-sand-100 text-ink-900'}`}>
              {m.senderId !== meId && <p className="mb-0.5 text-[10px] font-semibold opacity-70">{m.senderName}</p>}
              {m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2 border-t border-ink-900/5 p-3">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type a message…"
          className="flex-1 rounded-full border border-ink-900/10 px-3.5 py-2 text-sm focus:border-majorelle-500 focus:outline-none"
        />
        <button onClick={send} className="rounded-full bg-majorelle-600 px-4 py-2 text-sm font-semibold text-white hover:bg-majorelle-700">
          Send
        </button>
      </div>
    </div>
  );
}
