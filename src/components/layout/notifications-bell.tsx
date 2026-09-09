'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';

interface Notif {
  id: string;
  type: string;
  content: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationsBell() {
  const { user } = useAuth();
  const t = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await api.get<{ notifications: Notif[] }>('/notifications');
      setItems(res.notifications);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!user) return;
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;
  const unread = items.filter((n) => !n.read).length;

  async function markAllRead() {
    await api.patch('/notifications');
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={t('notifications')}
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-10 w-10 place-items-center rounded-full text-ink-700 hover:bg-white"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute end-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-clay-500 text-[9px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute end-0 top-12 z-50 max-h-96 w-80 overflow-y-auto rounded-2xl bg-white p-2 shadow-xl">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-sm font-semibold text-ink-900">{t('notifications')}</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs font-semibold text-majorelle-700 hover:underline">
                {t('markAllRead')}
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-ink-500">{t('noNotifications')}</p>
          ) : (
            <ul className="divide-y divide-ink-900/5">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={(n.link as any) || '/'}
                    onClick={() => setOpen(false)}
                    className={`block rounded-xl px-2.5 py-2.5 text-sm hover:bg-sand-100 ${!n.read ? 'bg-majorelle-600/5' : ''}`}
                  >
                    <p className="text-ink-900">{n.content}</p>
                    <p className="mt-0.5 text-[11px] text-ink-300">{new Date(n.createdAt).toLocaleString()}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
