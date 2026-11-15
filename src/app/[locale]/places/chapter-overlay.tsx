'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  CATEGORY_META,
  thumbnailUrl,
  type CategoryKey,
  type Destination,
  type PlaceLocale,
} from '@/lib/places-catalogue';
import { OverlayPortal, useDialogBehavior } from './overlay';
import { PlaceTile } from './place-tile';

interface ChapterOverlayProps {
  category: CategoryKey;
  places: Destination[];
  chapterIndex: number;
  chapterTotal: number;
  locale: PlaceLocale;
  revealed: boolean;
  onReveal: () => void;
  onClose: () => void;
  onOpen: (place: Destination) => void;
}

export function ChapterOverlay({
  category,
  places,
  chapterIndex,
  chapterTotal,
  locale,
  revealed,
  onReveal,
  onClose,
  onOpen,
}: ChapterOverlayProps) {
  const t = useTranslations('places');
  const shellRef = useRef<HTMLElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const closeTimer = useRef<number | null>(null);
  const closingRef = useRef(false);
  const [closing, setClosing] = useState(false);

  const meta = CATEGORY_META[category];
  const heroImage = places.find((place) => place.images[0])?.images[0] || meta.image;

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    closeTimer.current = window.setTimeout(onClose, 260);
  }, [onClose]);

  useDialogBehavior(true, shellRef, requestClose);

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    [],
  );

  const revealGrid = () => {
    onReveal();
    bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    window.setTimeout(() => {
      gridRef.current?.querySelector<HTMLButtonElement>('.place-tile')?.focus({
        preventScroll: true,
      });
    }, 320);
  };

  return (
    <OverlayPortal>
      <div className="chapter-root" data-closing={closing ? 'true' : 'false'}>
        <button
          type="button"
          className="chapter-backdrop"
          tabIndex={-1}
          aria-label={t('close')}
          onClick={requestClose}
        />
        <section
          ref={shellRef}
          className="chapter-shell"
          data-collapsed={revealed ? 'true' : 'false'}
          role="dialog"
          aria-modal="true"
          aria-labelledby="places-chapter-title"
        >
          <div className="chapter-hero">
            <img
              className="chapter-hero-image"
              src={thumbnailUrl(heroImage, 1920)}
              alt=""
              decoding="async"
            />
            <span className="chapter-hero-scrim" aria-hidden />
            <span className="chapter-hero-grain" aria-hidden />

            <div className="chapter-topbar">
              <button type="button" className="chapter-back" onClick={requestClose}>
                <ArrowLeft size={17} aria-hidden />
                {t('allPlaces')}
              </button>
              <button
                type="button"
                className="chapter-close"
                onClick={requestClose}
                aria-label={t('close')}
                data-autofocus
              >
                <X size={20} aria-hidden />
              </button>
            </div>

            <div className="chapter-hero-copy">
              <p className="chapter-eyebrow">
                <span>{t('chapterLabel', { number: meta.number })}</span>
                <span aria-hidden>·</span>
                <span>{t('chapterProgress', { current: chapterIndex + 1, total: chapterTotal })}</span>
              </p>
              <h2 id="places-chapter-title">{t(category)}</h2>
              <p className="chapter-intro">{t(`chapterIntro.${category}`)}</p>
              <div className="chapter-hero-actions">
                <button type="button" className="chapter-reveal" onClick={revealGrid}>
                  {t('chapterCta')}
                  <ArrowDown size={16} aria-hidden />
                </button>
                <span className="chapter-count">
                  {t('resultsCount', { count: places.length })}
                </span>
              </div>
            </div>
          </div>

          <div ref={bodyRef} className="chapter-body">
            {places.length === 0 ? (
              <p className="chapter-empty">{t('chapterEmpty')}</p>
            ) : (
              <div ref={gridRef} className="chapter-grid" role="list">
                {places.map((place, index) => (
                  <div key={place.id} role="listitem">
                    <PlaceTile
                      place={place}
                      locale={locale}
                      index={index}
                      variant="chapter"
                      onOpen={onOpen}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </OverlayPortal>
  );
}
