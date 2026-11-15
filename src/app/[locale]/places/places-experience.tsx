'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Script from 'next/script';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, MapPin, Search } from 'lucide-react';
import { api } from '@/lib/api-client';
import {
  buildDestinations,
  CATEGORY_KEYS,
  CATEGORY_META,
  cityOptions,
  getLocalized,
  getSummary,
  thumbnailUrl,
  type ApiPlaceLike,
  type CategoryKey,
  type Destination,
  type PlaceLocale,
} from '@/lib/places-catalogue';
import { ChapterOverlay } from './chapter-overlay';
import { DestinationViewer, type ViewerSource } from './destination-viewer';
import { PlaceTile } from './place-tile';
import { PlacesMap, type PlacesMapHandle } from './places-map';

interface ViewerState {
  placeId: string;
  source: ViewerSource;
  sequenceIds: string[];
}

function hasCoordinates(place: Destination): boolean {
  return (
    typeof place.lat === 'number' &&
    Number.isFinite(place.lat) &&
    typeof place.lng === 'number' &&
    Number.isFinite(place.lng)
  );
}

function toPlaceLocale(locale: string): PlaceLocale {
  return locale === 'fr' || locale === 'ar' ? locale : 'en';
}

export function PlacesExperience() {
  const t = useTranslations('places');
  const locale = toPlaceLocale(useLocale());
  const mapRef = useRef<PlacesMapHandle | null>(null);
  const chapterTriggerRef = useRef<HTMLElement | null>(null);
  const viewerTriggerRef = useRef<{ element: HTMLElement | null; placeId: string | null }>({
    element: null,
    placeId: null,
  });

  const [apiPlaces, setApiPlaces] = useState<ApiPlaceLike[] | undefined>(undefined);
  const [leafletReady, setLeafletReady] = useState(false);
  const [leafletError, setLeafletError] = useState(false);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('all');
  const [category, setCategory] = useState<'all' | CategoryKey>('all');
  const [chapterOpen, setChapterOpen] = useState(false);
  const [chapterRevealed, setChapterRevealed] = useState(false);
  const [viewer, setViewer] = useState<ViewerState | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ places?: ApiPlaceLike[] }>('/places')
      .then((response) => {
        if (!cancelled) setApiPlaces(response.places || []);
      })
      .catch(() => {
        if (!cancelled) setApiPlaces([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const destinations = useMemo(() => buildDestinations(apiPlaces, locale), [apiPlaces, locale]);

  const cities = useMemo(() => cityOptions(destinations), [destinations]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<CategoryKey, number>();
    for (const key of CATEGORY_KEYS) counts.set(key, 0);
    for (const place of destinations) {
      counts.set(place.category, (counts.get(place.category) || 0) + 1);
    }
    return counts;
  }, [destinations]);

  const chapterImage = useMemo(() => {
    const images = new Map<CategoryKey, string>();
    for (const place of destinations) {
      if (!images.has(place.category) && place.images[0]) {
        images.set(place.category, place.images[0]);
      }
    }
    return images;
  }, [destinations]);

  const normalizedQuery = query.trim().toLocaleLowerCase(locale);
  const filtered = useMemo(
    () =>
      destinations.filter((place) => {
        if (category !== 'all' && place.category !== category) return false;
        if (city !== 'all' && place.city !== city) return false;
        if (normalizedQuery) {
          const haystack = [
            place.name,
            place.city,
            getSummary(place, locale),
            getLocalized(place.description, locale),
          ]
            .join(' ')
            .toLocaleLowerCase(locale);
          if (!haystack.includes(normalizedQuery)) return false;
        }
        return true;
      }),
    [category, city, destinations, locale, normalizedQuery],
  );

  const mappedCount = destinations.filter(hasCoordinates).length;
  const unmappedFiltered = filtered.filter((place) => !hasCoordinates(place)).length;
  const heroPlace =
    destinations.find((place) => place.name === 'Jardin Majorelle' && place.images[0]) ||
    destinations.find((place) => place.images[0]);
  const heroImage = heroPlace?.images[0] || CATEGORY_META.jardin.image;
  const chapterIndex = category === 'all' ? 0 : CATEGORY_KEYS.indexOf(category);

  const openChapter = (key: CategoryKey) => {
    chapterTriggerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setQuery('');
    setCity('all');
    setCategory(key);
    setChapterOpen(true);
    setChapterRevealed(false);
    setViewer(null);
  };

  const closeChapter = useCallback(() => {
    setChapterOpen(false);
    setChapterRevealed(false);
    setCategory('all');
    window.setTimeout(() => {
      if (chapterTriggerRef.current?.isConnected) {
        chapterTriggerRef.current.focus({ preventScroll: true });
      }
    }, 0);
  }, []);

  const closeViewer = useCallback(() => {
    const trigger = viewerTriggerRef.current;
    setViewer(null);
    window.setTimeout(() => {
      if (chapterOpen && trigger.placeId) {
        const tile = document.querySelector<HTMLElement>(
          `.chapter-shell .place-tile[data-place-id="${CSS.escape(trigger.placeId)}"]`,
        );
        if (tile) {
          tile.focus({ preventScroll: true });
          tile.scrollIntoView({ block: 'nearest' });
          return;
        }
      }
      if (trigger.element?.isConnected) {
        trigger.element.focus({ preventScroll: true });
      }
    }, 70);
  }, [chapterOpen]);

  const resetFilters = () => {
    setQuery('');
    setCity('all');
    setCategory('all');
    setChapterOpen(false);
    setChapterRevealed(false);
  };

  const openFromList = (place: Destination) => {
    viewerTriggerRef.current = {
      element: document.activeElement instanceof HTMLElement ? document.activeElement : null,
      placeId: place.id,
    };
    mapRef.current?.focusPlace(place.id, { preview: false });
    setViewer({
      placeId: place.id,
      source: 'list',
      sequenceIds: filtered.map((item) => item.id),
    });
  };

  const openFromMap = (place: Destination) => {
    viewerTriggerRef.current = {
      element: document.activeElement instanceof HTMLElement ? document.activeElement : null,
      placeId: place.id,
    };
    setViewer({ placeId: place.id, source: 'map', sequenceIds: [place.id] });
  };

  const viewerPlace = viewer
    ? destinations.find((place) => place.id === viewer.placeId) || null
    : null;

  const viewerSequence = useMemo(() => {
    if (!viewer) return [];
    const byId = new Map(destinations.map((place) => [place.id, place]));
    return viewer.sequenceIds
      .map((id) => byId.get(id))
      .filter((place): place is Destination => Boolean(place));
  }, [destinations, viewer]);

  useEffect(() => {
    if (viewer && !viewerPlace) setViewer(null);
  }, [viewer, viewerPlace]);

  return (
    <>
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        strategy="afterInteractive"
        onLoad={() => setLeafletReady(true)}
        onError={() => setLeafletError(true)}
      />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <div className="places-experience">
        <header className="places-hero">
          <div className="places-hero-copy">
            <p className="places-eyebrow">
              <span className="places-eyebrow-line" aria-hidden />
              {t('eyebrow', { count: destinations.length })}
            </p>
            <h1>{t('title')}</h1>
            <p className="places-hero-lede">{t('subtitle')}</p>
            <div className="places-hero-meta">
              <span>
                <MapPin size={14} aria-hidden />
                {t('mappedCount', { count: mappedCount })}
              </span>
              <span>{t('resultsCount', { count: destinations.length })}</span>
            </div>
            <button
              type="button"
              className="places-hero-cta"
              onClick={() => document.getElementById('places-atlas')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              {t('listingTitle')}
              <ArrowRight size={17} aria-hidden />
            </button>
          </div>

          <div className="places-hero-art">
            <span className="places-hero-arch" aria-hidden />
            <img
              src={thumbnailUrl(heroImage, 1280)}
              alt={heroPlace?.name || ''}
              decoding="async"
            />
            <span className="places-hero-art-shade" aria-hidden />
            <span className="places-hero-stamp">
              <span>31°37′N</span>
              <span>7°59′W</span>
            </span>
          </div>
        </header>

        <section className="places-chapters" aria-labelledby="places-chapters-title">
          <div className="places-section-head">
            <div>
              <p className="places-kicker" id="places-chapters-title">
                {t('chapters')}
              </p>
              <h2>{t('chapterProgress', { current: 1, total: CATEGORY_KEYS.length })}</h2>
            </div>
            <button
              type="button"
              className="places-reset"
              onClick={resetFilters}
              disabled={category === 'all' && !query && city === 'all'}
            >
              {t('allPlaces')}
            </button>
          </div>

          <div className="places-chapter-rail">
            {CATEGORY_KEYS.map((key) => {
              const meta = CATEGORY_META[key];
              const image = chapterImage.get(key) || meta.image;
              return (
                <button
                  key={key}
                  type="button"
                  className="chapter-card"
                  style={{ '--chapter-accent': meta.accent } as CSSProperties}
                  onClick={() => openChapter(key)}
                >
                  <span className="chapter-card-media">
                    <img
                      src={thumbnailUrl(image, 640)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />
                  </span>
                  <span className="chapter-card-scrim" aria-hidden />
                  <span className="chapter-card-number">{meta.number}</span>
                  <span className="chapter-card-copy">
                    <strong>{t(key)}</strong>
                    <span>{t('resultsCount', { count: categoryCounts.get(key) || 0 })}</span>
                  </span>
                  <span className="chapter-card-arrow" aria-hidden>
                    <ArrowRight size={16} />
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="places-atlas" id="places-atlas" aria-label={t('mapTitle')}>
          <div className="places-map-column">
            <div className="places-map-heading">
              <div>
                <p className="places-kicker">{t('mapTitle')}</p>
                <p>{t('mapHint')}</p>
              </div>
            </div>
            <PlacesMap
              ref={mapRef}
              destinations={filtered}
              category={category}
              leafletReady={leafletReady}
              leafletError={leafletError}
              onOpen={openFromMap}
            />
          </div>

          <div className="places-list-column">
            <div className="places-list-head">
              <div>
                <p className="places-kicker">{t('listingTitle')}</p>
                <h2>{t('resultsCount', { count: filtered.length })}</h2>
              </div>
              {unmappedFiltered > 0 ? (
                <p className="places-unmapped-note">
                  {t('withoutCoordinates', { count: unmappedFiltered })}
                </p>
              ) : null}
            </div>

            <div className="places-filters">
              <label className="places-search">
                <Search size={17} aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t('searchPlaceholder')}
                  aria-label={t('searchPlaceholder')}
                />
              </label>
              <label className="places-city">
                <span className="sr-only">{t('cityFilter')}</span>
                <select
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  aria-label={t('cityFilter')}
                >
                  <option value="all">{t('allCities')}</option>
                  {cities.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {filtered.length === 0 ? (
              <div className="places-empty">
                <p>{t('emptyResults')}</p>
                <button type="button" onClick={resetFilters}>
                  {t('allPlaces')}
                </button>
              </div>
            ) : (
              <div className="places-grid">
                {filtered.map((place, index) => (
                  <PlaceTile
                    key={place.id}
                    place={place}
                    locale={locale}
                    index={index}
                    onOpen={openFromList}
                  />
                ))}
              </div>
            )}

            <p className="places-credit">{t('sourceCredit')}</p>
          </div>
        </section>
      </div>

      {chapterOpen && !viewer && category !== 'all' ? (
        <ChapterOverlay
          category={category}
          places={filtered}
          chapterIndex={chapterIndex}
          chapterTotal={CATEGORY_KEYS.length}
          locale={locale}
          revealed={chapterRevealed}
          onReveal={() => setChapterRevealed(true)}
          onClose={closeChapter}
          onOpen={openFromList}
        />
      ) : null}

      {viewer && viewerPlace ? (
        <DestinationViewer
          place={viewerPlace}
          sequence={viewerSequence}
          source={viewer.source}
          locale={locale}
          returnToChapter={chapterOpen}
          onNavigate={(index) => {
            setViewer((previous) => {
              if (!previous) return previous;
              const placeId = previous.sequenceIds[index];
              return placeId ? { ...previous, placeId } : previous;
            });
          }}
          onClose={closeViewer}
        />
      ) : null}
    </>
  );
}
