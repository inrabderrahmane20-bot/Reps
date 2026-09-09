'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BadgeCheck, Users, Flag, Newspaper, LogOut, ExternalLink } from 'lucide-react';

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/providers', label: 'Provider verification', icon: BadgeCheck },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/reports', label: 'Reports', icon: Flag },
  { href: '/admin/news', label: 'News', icon: Newspaper },
];

export function AdminNav({ userName }: { userName: string }) {
  const pathname = usePathname();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/en';
  }

  return (
    <nav className="flex w-64 shrink-0 flex-col border-e border-ink-900/10 bg-white p-5">
      <div className="mb-8">
        <p className="font-display text-lg font-semibold">Medina Admin</p>
        <p className="mt-0.5 text-xs text-ink-500">{userName}</p>
      </div>
      <ul className="flex-1 space-y-1">
        {links.map((l) => {
          const active = pathname === l.href;
          const Icon = l.icon;
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  active ? 'bg-majorelle-600 text-white' : 'text-ink-700 hover:bg-sand-100'
                }`}
              >
                <Icon size={16} /> {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <a href="/en" className="mb-2 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-sand-100">
        <ExternalLink size={16} /> View public site
      </a>
      <button onClick={logout} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-start text-sm font-medium text-clay-500 hover:bg-sand-100">
        <LogOut size={16} /> Sign out
      </button>
    </nav>
  );
}
