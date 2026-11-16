'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  CATEGORY_META, getSummary, mapsEmbedUrl, mapsUrl, thumbnailUrl, validCoordinates,
  type Destination, type PlaceLocale,
} from '@/lib/places-catalogue';

export interface PlacesMapHandle {
  focusPlace: (id: string) => void;
}

interface PlacesMapProps {
  destinations: Destination[];
  onSelect: (id: string | null) => void;
  onOpen: (place: Destination) => void;
}

/** Google owns the iframe; our selector controls locations without simulated pins. */
export const PlacesMap = forwardRef<PlacesMapHandle, PlacesMapProps>(function PlacesMap(
  { destinations, onSelect, onOpen }, ref,
) {
  const t = useTranslations('places');
  const locale = useLocale() as PlaceLocale;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const selected = destinations.find(place => place.id === selectedId) || destinations[0];
  const embedUrl = selected ? mapsEmbedUrl(selected, locale) : '';

  useEffect(() => {
    // Clear selections removed by category, city or text filters.
    setSelectedId(selected?.id ?? null);
    onSelect(selected?.id ?? null);
  }, [selected?.id, onSelect]);

  const focusPlace = useCallback((id: string) => setSelectedId(id), []);
  useImperativeHandle(ref, () => ({ focusPlace }), [focusPlace]);

  return (
    <div className="place-google-map" role="region" aria-label={t('mapRegion')}>
      <label className="place-map-select">
        <span>{t('mapSelectPlace')}</span>
        <select value={selected?.id ?? ''} disabled={!destinations.length} onChange={event => setSelectedId(event.target.value)}>
          {!destinations.length ? <option value="">{t('emptyResults')}</option> : null}
          {destinations.map(place => (
            <option key={place.id} value={place.id}>{place.name} · {place.city}</option>
          ))}
        </select>
      </label>
      {selected ? (
        <>
          <div className="place-map-shell">
            <iframe
              className="place-map-canvas"
              src={embedUrl}
              title={t('showOnMap', { name: selected.name })}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              onError={() => setFailedUrl(embedUrl)}
            />
          </div>
          <div className="place-map-selection">
            <button type="button" className="place-map-selection-preview" onClick={() => onOpen(selected)} aria-label={t('openPlace', { name: selected.name })}>
              <img
                key={selected.id}
                src={thumbnailUrl(selected.images[0] || CATEGORY_META[selected.category].image, 250)}
                alt=""
                loading="lazy"
                decoding="async"
                onError={event => {
                  const image = event.currentTarget;
                  if (image.dataset.fallback) { image.style.visibility = 'hidden'; return; }
                  image.dataset.fallback = 'true';
                  image.src = CATEGORY_META[selected.category].image;
                }}
              />
              <span className="place-map-selection-copy">
                <span className="places-kicker">{selected.city} · {t(selected.category)}</span>
                <strong>{selected.name}</strong>
                <span className="place-map-preview-summary">{getSummary(selected, locale)}</span>
                <span className="place-map-selection-action">{t('viewDetails')} <ArrowUpRight size={16} aria-hidden /></span>
              </span>
            </button>
            {!validCoordinates(selected.lat, selected.lng) ? <p>{t('unmappedNote')}</p> : null}
            {failedUrl === embedUrl ? <p role="status">{t('mapUnavailable')}</p> : null}
            <a href={mapsUrl(selected)} target="_blank" rel="noopener noreferrer">
              {t('openInMaps')} <ExternalLink size={14} aria-hidden />
            </a>
          </div>
        </>
      ) : <p className="places-empty" role="status">{t('emptyResults')}</p>}
    </div>
  );
});
