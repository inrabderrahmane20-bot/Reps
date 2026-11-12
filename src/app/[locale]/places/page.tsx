'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Script from 'next/script';
import { useLocale, useTranslations } from 'next-intl';
import { MapPin, Search } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Place } from '@/lib/types';

type PlaceRecord = Omit<Place, 'status' | 'createdAt'> & { status?: string };

const FALLBACK_SECTIONS = [
  {
    key: 'jardin',
    names: [
      'Jardin Majorelle',
      'Jardin de la Ménara',
      "Jardins de l'Agdal",
      'Le Jardin Secret',
      'Cyber Park Arsat Moulay Abdeslam',
      'Palmeraie de Marrakech',
      'Parc Lalla Hasna',
      "Oliveraie de la Ménara",
    ],
  },
  {
    key: 'monuments',
    names: [
      'Koutoubia',
      'Médersa Ben Youssef',
      'Palais de la Bahia',
      'Palais El Badiî',
      'Tombeaux Saadiens',
      'Bab Agnaou',
      'Bab Boujloud',
      'Musée de Marrakech',
      'Musée de Mouassine',
      'Dar El Bacha',
      'Maison de la Photographie',
      'Musée Dar Si Saïd',
      'Musée de la Femme',
      'Souk Semmarine',
      'Souk des Teinturiers',
      'Souk des Bijoutiers',
      'Souk Haddadine',
      'Place des Épices',
      'Place des Ferblantiers',
      'Quartier de la Kasbah',
      'Quartier de Mouassine',
      'Quartier Mellah',
      'Synagogue Lazama',
    ],
  },
  {
    key: 'musees',
    names: [
      'Musée Yves Saint Laurent Marrakech',
      'Musée Mohammed VI pour la civilisation de l’eau au Maroc',
      'Musée des Confluences – Dar El Bacha',
      'Musée de Marrakech',
      'Maison de la Photographie',
      'Musée Dar Si Saïd',
      'Musée de la Femme de Marrakech',
      'Musée MACAAL',
      'Musée Tiskiwin',
    ],
  },
  {
    key: 'excursions',
    names: [
      "Désert d'Agafay",
      "Vallée de l'Ourika",
      'Setti Fatma',
      "Cascades d'Ouzoud",
      'Lac Lalla Takerkoust',
      'Plateau du Kik',
      'Imlil',
      'Parc national du Toubkal',
      'Asni',
      'Ouirgane',
      'Aït Ben Haddou',
      'Ouarzazate',
      'Vallée du Zat',
      'Palmeraie de Marrakech',
      'Circuit en quad dans la Palmeraie',
      'Balade à dos de chameau',
      'Vol en montgolfière autour de Marrakech',
      'Excursion en buggy',
    ],
  },
  {
    key: 'experiences',
    names: [
      'Dîner traditionnel marocain',
      'Spectacle de fantasia',
      'Hammam marocain traditionnel',
      'Rooftop avec vue sur la médina',
      'Coucher de soleil à Jemaa el-Fna',
      "Dîner dans le désert d'Agafay",
      'Balade en calèche',
      'Spa traditionnel marocain',
      'Dégustation de thé à la menthe',
      'Découverte de la cuisine de rue de la médina',
      'Balade nocturne dans la médina',
    ],
  },
  {
    key: 'autres',
    names: ['Cafés', 'Restaurants', 'Parcs', 'Piscines', 'Hôtels', 'Salles de sport (Karaté, Yoga, Musculation)'],
  },
];

const CITIES = ['Marrakech', 'Casablanca', 'Rabat', 'Fès', 'Agadir'];

function hasCoordinates(place: PlaceRecord): place is PlaceRecord & { lat: number; lng: number } {
  return (
    typeof place.lat === 'number' &&
    Number.isFinite(place.lat) &&
    Math.abs(place.lat) <= 90 &&
    typeof place.lng === 'number' &&
    Number.isFinite(place.lng) &&
    Math.abs(place.lng) <= 180
  );
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!
  );
}

export default function PlacesPage() {
  const t = useTranslations('places');
  const locale = useLocale();
  const [places, setPlaces] = useState<PlaceRecord[]>([]);
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [leafletReady, setLeafletReady] = useState(false);
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const markerLayerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ places?: PlaceRecord[] }>('/places')
      .then((response) => {
        if (!cancelled) setPlaces(response.places ?? []);
      })
      .catch((error) => {
        console.error('Could not load places.', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const placeRecords = useMemo<PlaceRecord[]>(() => {
    if (places.length) return places;
    return FALLBACK_SECTIONS.flatMap((section) =>
      section.names.map((name, index) => ({
        id: `suggested-${section.key}-${index}`,
        name,
        category: section.key,
        city: 'Marrakech',
      }))
    );
  }, [places]);

  const categories = useMemo(
    () => [...new Set(placeRecords.map((place) => place.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [placeRecords]
  );

  const filteredPlaces = useMemo(() => {
    const search = query.trim().toLocaleLowerCase(locale);
    return placeRecords.filter((place) => {
      if (place.status && place.status !== 'active') return false;
      if (city && !place.city.toLocaleLowerCase(locale).includes(city.toLocaleLowerCase(locale))) return false;
      if (category && place.category !== category) return false;
      if (
        search &&
        ![place.name, place.category, place.city, place.address, place.description]
          .filter(Boolean)
          .some((value) => value!.toLocaleLowerCase(locale).includes(search))
      ) {
        return false;
      }
      return true;
    });
  }, [placeRecords, city, category, query, locale]);

  const mappedPlaces = useMemo(() => filteredPlaces.filter(hasCoordinates), [filteredPlaces]);
  const unmappedCount = filteredPlaces.length - mappedPlaces.length;

  useEffect(() => {
    if (activePlaceId && !filteredPlaces.some((place) => place.id === activePlaceId)) {
      setActivePlaceId(null);
    }
  }, [activePlaceId, filteredPlaces]);

  const sections = useMemo(() => {
    const grouped = new Map<string, PlaceRecord[]>();
    filteredPlaces.forEach((place) => {
      const key = place.category || 'autres';
      const items = grouped.get(key) ?? [];
      items.push(place);
      grouped.set(key, items);
    });
    return [...grouped.entries()].map(([key, items]) => ({ key, items }));
  }, [filteredPlaces]);

  useEffect(() => {
    if (!leafletReady || !containerRef.current || mapRef.current) return;
    const L = (window as any).L;
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([31.6295, -8.0089], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    markerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const markers = markersRef.current;

    return () => {
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      markers.clear();
    };
  }, [leafletReady]);

  useEffect(() => {
    if (!leafletReady || !mapRef.current || !markerLayerRef.current) return;
    const L = (window as any).L;
    const markerLayer = markerLayerRef.current;
    markerLayer.clearLayers();
    markersRef.current.clear();

    mappedPlaces.forEach((place) => {
      const marker = L.marker([place.lat, place.lng], {
        icon: L.divIcon({
          className: 'place-map-pin',
          html: '<span></span>',
          iconSize: [30, 38],
          iconAnchor: [15, 34],
        }),
      })
        .bindPopup(`<strong>${escapeHtml(place.name)}</strong><br/>${escapeHtml(place.category)}`)
        .on('click', () => setActivePlaceId(place.id));
      marker.addTo(markerLayer);
      markersRef.current.set(place.id, marker);
    });

    if (mappedPlaces.length === 1) {
      mapRef.current.setView([mappedPlaces[0].lat, mappedPlaces[0].lng], 15);
    } else if (mappedPlaces.length > 1) {
      const bounds = L.latLngBounds(mappedPlaces.map((place) => [place.lat, place.lng]));
      mapRef.current.fitBounds(bounds, { padding: [28, 28], maxZoom: 15 });
    }
  }, [mappedPlaces, leafletReady]);

  useEffect(() => {
    if (!activePlaceId || !mapRef.current) return;
    const marker = markersRef.current.get(activePlaceId);
    if (!marker) return;
    mapRef.current.setView(marker.getLatLng(), Math.max(mapRef.current.getZoom(), 15));
    marker.openPopup();
  }, [activePlaceId]);

  return (
    <div className="places-page mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        strategy="afterInteractive"
        onLoad={() => setLeafletReady(true)}
      />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <header className="mb-5">
        <h1 className="font-display text-3xl font-semibold text-ink-900">{t('title')}</h1>
        <p className="mt-1.5 text-sm text-ink-500">{t('subtitle')}</p>
      </header>

      <section className="places-map-section" aria-label={t('mapTitle')}>
        <div className="places-map-toolbar">
          <label className="places-search">
            <Search size={18} aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActivePlaceId(null);
              }}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
            />
          </label>
          <button type="button" className="places-location-button" onClick={() => mapRef.current?.setView([31.6295, -8.0089], 13)}>
            <MapPin size={16} aria-hidden />
            {t('mapCity')}
          </button>
        </div>

        <div className="places-map-frame">
          <div ref={containerRef} className="places-map" role="application" aria-label={t('mapTitle')} />
          {!leafletReady && <p className="places-map-status">{t('mapLoading')}</p>}
          {leafletReady && mappedPlaces.length === 0 && (
            <p className="places-map-status">{t('noMappedPlaces')}</p>
          )}
          {leafletReady && mappedPlaces.length > 0 && (
            <span className="places-map-count">{t('mappedCount', { count: mappedPlaces.length })}</span>
          )}
        </div>
      </section>

      <section className="places-results" aria-labelledby="places-results-title" data-tour-target="places-list">
        <div className="places-results-heading">
          <div>
            <h2 id="places-results-title" className="font-display text-2xl font-semibold text-ink-900">
              {t('listingTitle')}
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              {t('resultsCount', { count: filteredPlaces.length })}
              {unmappedCount > 0 ? ` · ${t('withoutCoordinates', { count: unmappedCount })}` : ''}
            </p>
          </div>
          <div className="places-filters" data-tour-target="places-filters">
            <select aria-label={t('cityFilter')} value={city} onChange={(event) => setCity(event.target.value)}>
              <option value="">{t('allCities')}</option>
              {CITIES.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
            <select aria-label={t('categoryFilter')} value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">{t('allCategories')}</option>
              {categories.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
        </div>

        {sections.length === 0 ? (
          <p className="places-empty">{t('emptyResults')}</p>
        ) : (
          <div className="places-list">
            {sections.map((section) => (
              <section key={section.key} className="places-list-section">
                <h3>{section.key === 'autres' || FALLBACK_SECTIONS.some(({ key }) => key === section.key) ? t(section.key as 'autres' | 'jardin' | 'monuments' | 'musees' | 'excursions' | 'experiences') : section.key}</h3>
                <div className="places-cards">
                  {section.items.map((place) => {
                    const hasPin = hasCoordinates(place);
                    return (
                      <article
                        key={place.id}
                        className={`place-card${activePlaceId === place.id ? ' is-active' : ''}${hasPin ? ' has-pin' : ''}`}
                      >
                        <span className="place-card-icon" aria-hidden>
                          <MapPin size={19} />
                        </span>
                        <div className="place-card-copy">
                          <h4>{place.name}</h4>
                          <p>{place.city}{place.address ? ` · ${place.address}` : ''}</p>
                        </div>
                        {hasPin ? (
                          <button
                            type="button"
                            className="place-card-map-action"
                            onClick={() => setActivePlaceId(place.id)}
                            aria-label={t('showOnMap', { name: place.name })}
                          >
                            <MapPin size={17} aria-hidden />
                          </button>
                        ) : (
                          <span className="place-card-no-pin" title={t('missingCoordinates')}>
                            {t('locationPending')}
                          </span>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
