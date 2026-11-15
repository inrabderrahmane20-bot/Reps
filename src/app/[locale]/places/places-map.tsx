'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { ArrowUpRight, LocateFixed, Maximize, Minus, Plus, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  CATEGORY_META,
  getSummary,
  thumbnailUrl,
  type CategoryKey,
  type Destination,
  type PlaceLocale,
} from '@/lib/places-catalogue';

const MARRAKECH_CENTER: [number, number] = [31.6295, -7.9811];

export interface PlacesMapHandle {
  focusPlace: (id: string, options?: { preview?: boolean }) => void;
  fitAll: () => void;
  recenter: () => void;
}

interface PlacesMapProps {
  destinations: Destination[];
  category: 'all' | CategoryKey;
  leafletReady: boolean;
  leafletError: boolean;
  onOpen: (place: Destination) => void;
}

type MappedDestination = Destination & { lat: number; lng: number };

interface Group {
  places: MappedDestination[];
  point: any;
}

function hasCoordinates(place: Destination): place is MappedDestination {
  return (
    typeof place.lat === 'number' &&
    Number.isFinite(place.lat) &&
    typeof place.lng === 'number' &&
    Number.isFinite(place.lng)
  );
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  );
}

function leaflet(): any {
  return typeof window !== 'undefined' ? (window as any).L : null;
}

export const PlacesMap = forwardRef<PlacesMapHandle, PlacesMapProps>(function PlacesMap(
  { destinations, category, leafletReady, leafletError, onOpen },
  ref,
) {
  const t = useTranslations('places');
  const locale = useLocale() as PlaceLocale;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerLayerRef = useRef<any>(null);
  const markerElsRef = useRef<Map<string, HTMLElement>>(new Map());
  const destinationsRef = useRef(destinations);
  const selectedIdRef = useRef<string | null>(null);
  const pendingFocusRef = useRef<{ id: string; preview: boolean } | null>(null);
  const previousCategoryRef = useRef(category);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const rebuildRef = useRef<() => void>(() => {});

  const [localScriptReady, setLocalScriptReady] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [selected, setSelected] = useState<Destination | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  destinationsRef.current = destinations;

  // If Leaflet was already loaded by a previous navigation, next/script may
  // not fire onLoad again. Watch for the global as a fallback.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).L) {
      setLocalScriptReady(true);
      return;
    }
    const interval = window.setInterval(() => {
      if ((window as any).L) {
        setLocalScriptReady(true);
        window.clearInterval(interval);
      }
    }, 250);
    const timeout = window.setTimeout(() => window.clearInterval(interval), 15000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [leafletReady]);

  const updateMarkerSelection = useCallback(() => {
    markerElsRef.current.forEach((element, id) => {
      const active = id === selectedIdRef.current;
      element.classList.toggle('is-selected', active);
      element.querySelector('.place-marker')?.classList.toggle('is-selected', active);
    });
  }, []);

  const rebuildMarkers = useCallback(() => {
    const L = leaflet();
    const map = mapRef.current;
    const layer = markerLayerRef.current;
    if (!L || !map || !layer) return;

    layer.clearLayers();
    markerElsRef.current.clear();

    const places = destinationsRef.current.filter(hasCoordinates);
    const groups: Group[] = places.map((place) => ({
      places: [place],
      point: map.latLngToContainerPoint([place.lat, place.lng]),
    }));

    // Merge markers whose rendered labels would overlap. The label is much
    // wider than its anchor, so a plain centre-to-centre radius clusters too
    // late and leaves names stacked on top of each other.
    const gap = 8;
    const footprint = (group: Group) => {
      const width = group.places.length > 1 ? 31 : 115;
      const top = group.places.length > 1 ? 31 : 60;
      const bottom = group.places.length > 1 ? 31 : 4;
      return {
        left: group.point.x - width - gap,
        right: group.point.x + width + gap,
        top: group.point.y - top - gap,
        bottom: group.point.y + bottom + gap,
      };
    };
    const overlaps = (a: Group, b: Group) => {
      const first = footprint(a);
      const second = footprint(b);
      return (
        first.left < second.right &&
        first.right > second.left &&
        first.top < second.bottom &&
        first.bottom > second.top
      );
    };
    const containsSelected = (group: Group) =>
      selectedIdRef.current !== null &&
      group.places.some((place) => place.id === selectedIdRef.current);

    let merged = true;
    while (merged) {
      merged = false;
      mergeLoop: for (let first = 0; first < groups.length; first += 1) {
        for (let second = first + 1; second < groups.length; second += 1) {
          const a = groups[first];
          const b = groups[second];
          if (containsSelected(a) || containsSelected(b) || !overlaps(a, b)) continue;
          const total = a.places.length + b.places.length;
          a.point = {
            x: (a.point.x * a.places.length + b.point.x * b.places.length) / total,
            y: (a.point.y * a.places.length + b.point.y * b.places.length) / total,
          };
          a.places = a.places.concat(b.places);
          groups.splice(second, 1);
          merged = true;
          break mergeLoop;
        }
      }
    }

    const openPreview = (place: Destination) => {
      selectedIdRef.current = place.id;
      setSelected(place);
      setShowPreview(true);
      updateMarkerSelection();
      map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), 16), { duration: 0.8 });
      window.setTimeout(() => {
        previewRef.current?.querySelector<HTMLButtonElement>('[data-preview-open]')?.focus({
          preventScroll: true,
        });
      }, 80);
    };

    for (const group of groups) {
      const centerLat = group.places.reduce((sum, place) => sum + place.lat, 0) / group.places.length;
      const centerLng = group.places.reduce((sum, place) => sum + place.lng, 0) / group.places.length;

      if (group.places.length === 1) {
        const place = group.places[0];
        const image = place.images[0] || CATEGORY_META[place.category].image;
        const html = `
          <span class="place-marker" dir="auto">
            <span class="place-marker-photo">
              <img src="${escapeHtml(thumbnailUrl(image, 330))}" alt="" loading="lazy" decoding="async" />
            </span>
            <span class="place-marker-copy">
              <span class="place-marker-name" dir="auto">${escapeHtml(place.name)}</span>
              <span class="place-marker-city" dir="auto">${escapeHtml(place.city)}</span>
            </span>
            <span class="place-marker-pin" aria-hidden="true"></span>
          </span>`;
        const marker = L.marker([place.lat, place.lng], {
          icon: L.divIcon({
            className: 'place-marker-icon',
            html,
            iconSize: [230, 64],
            iconAnchor: [115, 60],
          }),
          keyboard: true,
          riseOnHover: true,
          title: place.name,
        });
        marker.on('click', () => {
          openPreview(place);
        });
        marker.addTo(layer);

        const element = marker.getElement();
        if (element) {
          const active = place.id === selectedIdRef.current;
          element.dataset.placeId = place.id;
          element.classList.toggle('is-selected', active);
          element.querySelector('.place-marker')?.classList.toggle('is-selected', active);
          markerElsRef.current.set(place.id, element);
        }
        continue;
      }

      const count = group.places.length;
      const html = `
        <span class="place-cluster" dir="auto">
          <span class="place-cluster-count">${count}</span>
          <span class="place-cluster-dot" aria-hidden="true"></span>
        </span>`;
      const marker = L.marker([centerLat, centerLng], {
        icon: L.divIcon({
          className: 'place-cluster-icon',
          html,
          iconSize: [58, 58],
          iconAnchor: [29, 29],
        }),
        keyboard: true,
        title: t('mappedCount', { count }),
      });
      marker.on('click', () => {
        if (map.getZoom() >= 18) {
          openPreview(group.places[0]);
          return;
        }
        const bounds = L.latLngBounds(group.places.map((place) => [place.lat, place.lng]));
        map.flyToBounds(bounds, { padding: [70, 70], maxZoom: 18, duration: 0.8 });
      });
      marker.addTo(layer);
      const element = marker.getElement();
      if (element) {
        element.setAttribute('aria-label', t('mappedCount', { count }));
      }
    }
  }, [t, updateMarkerSelection]);

  rebuildRef.current = rebuildMarkers;
  const scriptReady = leafletReady || localScriptReady;

  useEffect(() => {
    if (!scriptReady || mapRef.current || !containerRef.current) return;
    const L = leaflet();
    if (!L) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
      minZoom: 5,
      maxZoom: 19,
      worldCopyJump: true,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 90,
      preferCanvas: true,
    }).setView(MARRAKECH_CENTER, 12.3);

    map.attributionControl.setPrefix('');
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
      detectRetina: true,
    }).addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);
    map.on('zoomend', () => rebuildRef.current());
    map.on('click', () => {
      selectedIdRef.current = null;
      setSelected(null);
      setShowPreview(false);
      updateMarkerSelection();
    });

    mapRef.current = map;
    setMapReady(true);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize({ pan: false });
    });
    resizeObserver.observe(containerRef.current);
    const frame = window.requestAnimationFrame(() => map.invalidateSize({ pan: false }));

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      map.off();
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      markerElsRef.current.clear();
      setMapReady(false);
    };
  }, [scriptReady, updateMarkerSelection]);

  useEffect(() => {
    if (!mapReady) return;
    rebuildRef.current();
  }, [destinations, mapReady]);

  useEffect(() => {
    if (selected && !destinations.some((place) => place.id === selected.id)) {
      selectedIdRef.current = null;
      setSelected(null);
      setShowPreview(false);
    }
  }, [destinations, selected]);

  useEffect(() => {
    if (!mapReady || previousCategoryRef.current === category) return;
    previousCategoryRef.current = category;
    const map = mapRef.current;
    const L = leaflet();
    if (!map || !L) return;
    if (category === 'all') {
      map.flyTo(MARRAKECH_CENTER, 12.3, { duration: 0.8 });
      return;
    }
    const mapped = destinationsRef.current.filter(hasCoordinates);
    if (!mapped.length) return;
    const bounds = L.latLngBounds(mapped.map((place) => [place.lat, place.lng]));
    map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 13, duration: 0.8 });
  }, [category, mapReady]);

  const closePreview = useCallback(() => {
    const id = selectedIdRef.current;
    setShowPreview(false);
    if (id) {
      const marker = markerElsRef.current.get(id);
      if (marker) marker.focus({ preventScroll: true });
    }
  }, []);

  const focusPlace = useCallback(
    (id: string, options?: { preview?: boolean }) => {
      const map = mapRef.current;
      if (!map) {
        pendingFocusRef.current = { id, preview: options?.preview ?? false };
        return;
      }
      const place = destinationsRef.current.find((item) => item.id === id);
      if (!place || !hasCoordinates(place)) return;
      selectedIdRef.current = id;
      setSelected(place);
      setShowPreview(options?.preview ?? false);
      updateMarkerSelection();
      map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), 15), { duration: 0.8 });
    },
    [updateMarkerSelection],
  );

  const fitAll = useCallback(() => {
    const map = mapRef.current;
    const L = leaflet();
    if (!map || !L) return;
    const mapped = destinationsRef.current.filter(hasCoordinates);
    if (!mapped.length) return;
    const bounds = L.latLngBounds(mapped.map((place) => [place.lat, place.lng]));
    map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 9, duration: 0.9 });
  }, []);

  const recenter = useCallback(() => {
    mapRef.current?.flyTo(MARRAKECH_CENTER, 12.3, { duration: 0.8 });
  }, []);

  useImperativeHandle(ref, () => ({ focusPlace, fitAll, recenter }), [
    focusPlace,
    fitAll,
    recenter,
  ]);

  useEffect(() => {
    if (!mapReady || !pendingFocusRef.current) return;
    const pending = pendingFocusRef.current;
    pendingFocusRef.current = null;
    const map = mapRef.current;
    const place = destinationsRef.current.find((item) => item.id === pending.id);
    if (!map || !place || !hasCoordinates(place)) return;
    selectedIdRef.current = place.id;
    setSelected(place);
    setShowPreview(pending.preview);
    updateMarkerSelection();
    map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), 15), { duration: 0.8 });
  }, [mapReady, updateMarkerSelection]);

  const mappedCount = destinations.filter(hasCoordinates).length;
  const previewImage = selected
    ? selected.images[0] || CATEGORY_META[selected.category].image
    : null;

  return (
    <div className="place-map-shell" role="region" aria-label={t('mapRegion')}>
      <div ref={containerRef} className="place-map-canvas" />

      {!mapReady && !leafletError ? (
        <div className="place-map-loading" aria-live="polite">
          <span className="place-map-loading-pulse" aria-hidden />
          <span>{t('mapLoading')}</span>
        </div>
      ) : null}

      {leafletError ? (
        <div className="place-map-loading place-map-loading--error" role="status">
          <span>{t('mapUnavailable')}</span>
        </div>
      ) : null}

      {mapReady && mappedCount === 0 ? (
        <div className="place-map-loading place-map-loading--soft" role="status">
          <span>{destinations.length === 0 ? t('emptyResults') : t('noMappedPlaces')}</span>
        </div>
      ) : null}

      {mapReady ? (
        <>
          <div className="place-map-badge" aria-live="polite">
            <span className="place-map-badge-dot" aria-hidden />
            {t('mappedCount', { count: mappedCount })}
          </div>
          <div className="place-map-controls">
            <button
              type="button"
              onClick={() => mapRef.current?.zoomIn()}
              aria-label={t('zoomIn')}
              title={t('zoomIn')}
            >
              <Plus size={18} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => mapRef.current?.zoomOut()}
              aria-label={t('zoomOut')}
              title={t('zoomOut')}
            >
              <Minus size={18} aria-hidden />
            </button>
            <button
              type="button"
              onClick={recenter}
              aria-label={t('mapRecenter')}
              title={t('mapRecenter')}
            >
              <LocateFixed size={17} aria-hidden />
            </button>
            <button
              type="button"
              onClick={fitAll}
              aria-label={t('mapOverview')}
              title={t('mapOverview')}
            >
              <Maximize size={17} aria-hidden />
            </button>
          </div>
        </>
      ) : null}

      {showPreview && selected ? (
        <div
          ref={previewRef}
          className="place-map-preview"
          role="group"
          aria-label={t('mapPreviewLabel')}
        >
          <button
            type="button"
            className="place-map-preview-close"
            onClick={closePreview}
            aria-label={t('close')}
          >
            <X size={16} aria-hidden />
          </button>
          <div className="place-map-preview-media">
            {previewImage ? (
              <img
                src={thumbnailUrl(previewImage, 960)}
                alt={selected.name}
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            ) : null}
            <span className="place-map-preview-scrim" aria-hidden />
            <span className="place-map-preview-category">{t(selected.category)}</span>
          </div>
          <div className="place-map-preview-body">
            <p className="place-map-preview-kicker">
              {selected.city} · {t('mapPreviewLabel')}
            </p>
            <h3>{selected.name}</h3>
            <p className="place-map-preview-summary">{getSummary(selected, locale)}</p>
            <p className="place-map-preview-hint">{t('mapPreviewHint')}</p>
            <button
              type="button"
              className="place-map-preview-open"
              data-preview-open
              onClick={() => onOpen(selected)}
            >
              {t('viewDetails')}
              <ArrowUpRight size={16} aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
});
