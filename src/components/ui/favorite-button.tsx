'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';

interface FavoriteButtonProps {
  type: 'provider' | 'listing' | 'news' | 'community' | 'activity' | 'place' | 'event' | 'product';
  targetId: string;
  meta?: Record<string, any>;
  className?: string;
}

export function FavoriteButton({ type, targetId, meta, className = '' }: FavoriteButtonProps) {
  const { user } = useAuth();
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setFavorited(false);
      return;
    }
    let cancelled = false;
    async function check() {
      try {
        const res = await api.get<{ items: Array<{ type: string; targetId: string }> }>('/favorites');
        if (cancelled) return;
        const exists = (res.items || []).some((f) => f.type === type && f.targetId === targetId);
        setFavorited(exists);
      } catch {
        // ignore
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [user, type, targetId]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user || loading) {
      return;
    }
    setLoading(true);
    try {
      if (favorited) {
        await api.delete(`/favorites?type=${encodeURIComponent(type)}&targetId=${encodeURIComponent(targetId)}`);
        setFavorited(false);
      } else {
        await api.post('/favorites', { type, targetId, meta });
        setFavorited(true);
      }
    } catch {
      // keep state on failure
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading || !user}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      title={user ? (favorited ? 'Remove from favorites' : 'Add to favorites') : 'Sign in to add to favorites'}
      className={`grid h-9 w-9 place-items-center rounded-full transition-colors ${
        favorited ? 'bg-peach-100 text-sunset-600' : 'bg-white/90 text-ink-500 hover:text-sunset-600'
      } shadow-card ${className} ${!user ? 'opacity-60' : ''}`}
    >
      <Star size={16} fill={favorited ? 'currentColor' : 'none'} />
    </button>
  );
}
