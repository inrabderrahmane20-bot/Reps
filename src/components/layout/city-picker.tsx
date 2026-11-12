'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, ChevronDown, MapPin } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import { ZONES, getZone } from '@/lib/zones';

const STORAGE_KEY = 'annabid:zone';

/**
 * Compact city / neighbourhood selector for the homepage header.
 *
 * It reuses the six official Marrakech zones. For signed-in visitors the
 * choice is persisted on the account (`zoneId` + `neighborhood`), which is the
 * same data the homepage already uses to rank nearby providers. Guests get a
 * local-only preference so the header still feels responsive.
 */
export function CityPicker({ variant = 'compact' }: { variant?: 'compact' | 'desktop' }) {
  const t = useTranslations('home');
  const { user, refresh } = useAuth();
  const [open, setOpen] = useState(false);
  const [zoneId, setZoneId] = useState('medina');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    const next = user?.zoneId || stored;
    if (next) setZoneId(next);
  }, [user?.zoneId]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const zone = getZone(zoneId);

  function choose(nextId: string) {
    const nextZone = getZone(nextId);
    if (!nextZone) return;
    setZoneId(nextId);
    setOpen(false);
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, nextId);

    if (user) {
      api
        .patch('/users/me', { zoneId: nextZone.id, neighborhood: nextZone.name })
        .then(() => refresh())
        .catch((error) => console.error('Could not save the selected city zone.', error));
    }
  }

  return (
    <div className={`city-picker city-picker--${variant}`} ref={rootRef}>
      <button
        type="button"
        className="city-picker-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('changeCity')}
        title={t('changeCity')}
      >
        <MapPin size={15} className="city-picker-pin" aria-hidden />
        <span className="city-picker-label">
          <span className="city-picker-city">{t('cityName')}</span>
          {zone ? <span className="city-picker-zone">{zone.name}</span> : null}
        </span>
        <ChevronDown
          size={14}
          className={`city-picker-chevron${open ? ' is-open' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="city-picker-menu" role="listbox" aria-label={t('changeCity')}>
          <p className="city-picker-menu-title">{t('changeCity')}</p>
          <ul>
            {ZONES.map((item) => {
              const selected = item.id === zoneId;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => choose(item.id)}
                    className={`city-picker-option${selected ? ' is-selected' : ''}`}
                  >
                    <span>{item.name}</span>
                    {selected ? <Check size={15} aria-hidden /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
