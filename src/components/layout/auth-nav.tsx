'use client';

import { LogIn, UserRound } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useDemoState } from './demo-state-provider';

export function AuthNav() {
  const { state } = useDemoState();

  return (
    <Link
      href="/profile"
      className="inline-flex items-center gap-2 rounded-full bg-majorelle-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-majorelle-700"
    >
      {state.user ? <UserRound size={16} /> : <LogIn size={16} />}
      <span className="hidden sm:inline">{state.user ? state.user.name : 'Sign in'}</span>
    </Link>
  );
}