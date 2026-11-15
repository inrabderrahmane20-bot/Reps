'use client';

import { memo, type CSSProperties } from 'react';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  getSummary,
  thumbnailUrl,
  type Destination,
  type PlaceLocale,
} from '@/lib/places-catalogue';

interface PlaceTileProps {
  place: Destination;
  locale: PlaceLocale;
  index?: number;
  variant?: 'grid' | 'chapter';
  onOpen: (place: Destination) => void;
}

function hasCoordinates(place: Destination): boolean {
  return (
    typeof place.lat === 'number' &&
    Number.isFinite(place.lat) &&
    typeof place.lng === 'number' &&
    Number.isFinite(place.lng)
  );
}

export const PlaceTile = memo(function PlaceTile({
  place,
  locale,
  index = 0,
  variant = 'grid',
  onOpen,
}: PlaceTileProps) {
  const t = useTranslations('places');
  const image = place.images[0];
  const summary = getSummary(place, locale);
  const mapped = hasCoordinates(place);

  return (
    <button
      type="button"
      className={`place-tile place-tile--${variant}`}
      style={{ '--tile-index': Math.min(index, 12) } as CSSProperties}
      data-place-id={place.id}
      onClick={() => onOpen(place)}
      aria-label={t('openPlace', { name: place.name })}
    >
      <span className="place-tile-media">
        {image ? (
          <img
            src={thumbnailUrl(image, variant === 'chapter' ? 640 : 960)}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ) : (
          <span className="place-tile-media-fallback" aria-hidden />
        )}
        <span className="place-tile-scrim" aria-hidden />
        <span className="place-tile-category">{t(place.category)}</span>
        {!mapped ? (
          <span className="place-tile-unmapped">
            <MapPin size={12} aria-hidden />
            {t('locationPending')}
          </span>
        ) : null}
      </span>
      <span className="place-tile-body">
        <span className="place-tile-kicker">
          <MapPin size={13} aria-hidden />
          {place.city}
        </span>
        <span className="place-tile-title">{place.name}</span>
        {summary ? <span className="place-tile-summary">{summary}</span> : null}
        <span className="place-tile-foot">
          <span>{t('discover')}</span>
          <ArrowUpRight size={16} aria-hidden />
        </span>
      </span>
    </button>
  );
});
