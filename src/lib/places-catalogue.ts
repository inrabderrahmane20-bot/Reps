import rawCatalogue from '@/data/place-destinations.json';

export const CATEGORY_KEYS = ['jardin', 'monuments', 'musees', 'excursions', 'experiences', 'autres'] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];
export type PlaceLocale = 'en' | 'fr' | 'ar';
export type LocalizedText = Record<PlaceLocale, string>;

export interface Destination {
  id: string;
  name: string;
  category: CategoryKey;
  city: string;
  lat?: number;
  lng?: number;
  images: string[];
  summary: LocalizedText;
  description: LocalizedText;
  source: Partial<LocalizedText>;
  origin: 'catalogue' | 'database';
}

export interface ApiPlaceLike {
  id: string;
  name: string;
  category?: string;
  subcategory?: string;
  city?: string;
  address?: string;
  description?: string;
  lat?: number;
  lng?: number;
  images?: string[];
  status?: string;
}

interface RawDestination {
  name: string;
  category: CategoryKey;
  city: string;
  lat?: number;
  lng?: number;
  images: string[];
  description: LocalizedText;
  short: LocalizedText;
  source?: Partial<LocalizedText>;
  wikipediaTitle?: string;
}

const raw = rawCatalogue as unknown as { destinations: RawDestination[] };

/** Chapter artwork used across the page, the map and the chapter overlay. */
export const CATEGORY_META: Record<
  CategoryKey,
  { image: string; number: string; accent: string }
> = {
  jardin: {
    image: '/images/categories/jardins-et-nature.jpg',
    number: '01',
    accent: '#2A7A69',
  },
  monuments: {
    image: '/images/categories/monuments-historiques-patrimoine.jpg',
    number: '02',
    accent: '#B84A26',
  },
  musees: {
    image: '/images/categories/musees-et-culture.jpg',
    number: '03',
    accent: '#963C1F',
  },
  excursions: {
    image: '/images/categories/excursions.jpg',
    number: '04',
    accent: '#C6A77B',
  },
  experiences: {
    image: '/images/categories/experiences-a-faire.jpg',
    number: '05',
    accent: '#D65B32',
  },
  autres: {
    image: '/images/categories/places.jpg',
    number: '06',
    accent: '#064E43',
  },
};

const CATEGORY_LABELS: Record<string, CategoryKey> = {
  jardin: 'jardin',
  jardins: 'jardin',
  'jardins et nature': 'jardin',
  'gardens and nature': 'jardin',
  monuments: 'monuments',
  'monuments historiques et patrimoine': 'monuments',
  'monuments historiques patrimoine': 'monuments',
  'historic monuments and heritage': 'monuments',
  museés: 'musees',
  musees: 'musees',
  'musees et culture': 'musees',
  'museums and culture': 'musees',
  excursions: 'excursions',
  'excursions et environs': 'excursions',
  'excursions and surroundings': 'excursions',
  experiences: 'experiences',
  'experiences a faire': 'experiences',
  'experiences to try': 'experiences',
  autres: 'autres',
  'etablissements et loisirs': 'autres',
  'establishments and leisure': 'autres',
};

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘`]/g, "'")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function looseName(value: string): string {
  return normalize(value).replace(/^(le|la|les|l|the)\s+/, '');
}

export function isCategoryKey(value: unknown): value is CategoryKey {
  return typeof value === 'string' && (CATEGORY_KEYS as readonly string[]).includes(value);
}

export function categoryFromPlace(place: ApiPlaceLike, fallback: CategoryKey): CategoryKey {
  if (isCategoryKey(place.subcategory)) return place.subcategory;
  const key = normalize(place.subcategory || place.category || '');
  return CATEGORY_LABELS[key] || fallback;
}

function validImage(url: string): boolean {
  return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'));
}

export function validCoordinates(lat?: number, lng?: number): boolean {
  return (
    typeof lat === 'number' &&
    Number.isFinite(lat) &&
    Math.abs(lat) <= 90 &&
    typeof lng === 'number' &&
    Number.isFinite(lng) &&
    Math.abs(lng) <= 180
  );
}

/**
 * Wikimedia only serves a fixed set of thumbnail widths. Requesting an
 * arbitrary width now returns HTTP 400, so every image is rounded up to the
 * closest official step.
 */
const WIKIMEDIA_WIDTHS = [20, 40, 60, 120, 250, 330, 500, 960, 1280, 1920, 3840];

function standardWidth(width: number): number {
  return WIKIMEDIA_WIDTHS.find((step) => step >= width) ?? 3840;
}

/** Wikimedia thumbnail helper: keeps payloads small on cards and markers. */
export function thumbnailUrl(url: string, width: number): string {
  if (!url || url.startsWith('/')) return url;
  const target = standardWidth(width);
  if (url.includes('/thumb/')) return url.split('?')[0].replace(/\/\d+px-/, `/${target}px-`);
  const upload = url
    .split('?')[0]
    .match(
      /^https:\/\/(?:upload|thumb)\.wikimedia\.org\/wikipedia\/commons\/([0-9a-f])\/([0-9a-f]{2})\/([^/]+)$/,
    );
  if (upload) {
    return `https://upload.wikimedia.org/wikipedia/commons/thumb/${upload[1]}/${upload[2]}/${upload[3]}/${target}px-${upload[3]}`;
  }
  return url;
}

function imageKey(url: string): string {
  let decoded = url.split('?')[0];
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // Keep the raw URL when a legacy filename is not valid percent-encoding.
  }
  const file = decoded.split('/').pop() || decoded;
  return file.replace(/^\d+px-/, '').toLowerCase();
}

function dedupeImages(images: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const url of images) {
    if (!validImage(url)) continue;
    const key = imageKey(url);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(url);
  }
  return result;
}

export function getLocalized(text: Partial<LocalizedText> | undefined, locale: PlaceLocale): string {
  if (!text) return '';
  return text[locale] || text.en || text.fr || text.ar || '';
}

export function getSummary(destination: Destination, locale: PlaceLocale): string {
  const summary = getLocalized(destination.summary, locale);
  if (summary) return summary;
  const description = getLocalized(destination.description, locale);
  if (description.length <= 170) return description;
  const slice = description.slice(0, 170);
  return `${slice.slice(0, Math.max(slice.lastIndexOf(' '), 120)).trimEnd()}…`;
}

export function getSourceUrl(destination: Destination, locale: PlaceLocale): string {
  return (
    destination.source[locale] ||
    destination.source.en ||
    destination.source.fr ||
    destination.source.ar ||
    ''
  );
}

export function mapsQuery(destination: Destination): string {
  if (validCoordinates(destination.lat, destination.lng)) {
    return `${destination.lat},${destination.lng}`;
  }
  return `${destination.name}, ${destination.city}, Maroc`;
}

export function mapsUrl(destination: Destination): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery(destination))}`;
}

/** Public Google Maps embed; no Platform API key or custom marker layer. */
export function mapsEmbedUrl(destination: Destination, locale: PlaceLocale): string {
  const params = new URLSearchParams({ q: mapsQuery(destination), output: 'embed', hl: locale, z: '15' });
  return `https://www.google.com/maps?${params}`;
}

export function sortDestinations(list: Destination[], locale: PlaceLocale): Destination[] {
  return [...list].sort((a, b) => {
    const categoryDelta =
      CATEGORY_KEYS.indexOf(a.category) - CATEGORY_KEYS.indexOf(b.category);
    if (categoryDelta !== 0) return categoryDelta;
    return a.name.localeCompare(b.name, locale, { sensitivity: 'base' });
  });
}

function emptyText(): LocalizedText {
  return { en: '', fr: '', ar: '' };
}

/**
 * Builds the single source of truth used by the list, the map and the viewer.
 * The generated editorial catalogue supplies the verified coordinates,
 * descriptions and photography; admin-managed database records are merged on
 * top by name so the page never forks into two different datasets.
 */
export function buildDestinations(
  apiPlaces: ApiPlaceLike[] | undefined,
  locale: PlaceLocale,
): Destination[] {
  const catalogue: Destination[] = raw.destinations.map((place, index) => {
    const images = dedupeImages(place.images);
    return {
      id: `catalogue-${index}`,
      name: place.name,
      category: place.category,
      city: place.city,
      ...(validCoordinates(place.lat, place.lng) ? { lat: place.lat, lng: place.lng } : {}),
      images: images.length ? images : [CATEGORY_META[place.category].image],
      summary: { ...emptyText(), ...place.short },
      description: { ...emptyText(), ...place.description },
      source: place.source || {},
      origin: 'catalogue',
    };
  });

  const byExactName = new Map<string, number>();
  const byLooseName = new Map<string, number>();
  catalogue.forEach((place, index) => {
    byExactName.set(normalize(place.name), index);
    byLooseName.set(looseName(place.name), index);
  });

  const merged = new Set<number>();
  const databaseOnly: Destination[] = [];
  const activePlaces = (apiPlaces || []).filter(
    (place) => place && place.name && (!place.status || place.status === 'active'),
  );

  for (const record of activePlaces) {
    const matchIndex =
      byExactName.get(normalize(record.name)) ?? byLooseName.get(looseName(record.name));

    if (typeof matchIndex === 'number') {
      if (merged.has(matchIndex)) continue;
      merged.add(matchIndex);
      const target = catalogue[matchIndex];
      const images = dedupeImages(record.images || []);
      const fallbackCategory = target?.category || 'autres';
      catalogue[matchIndex] = {
        ...target,
        name: record.name || target.name,
        city: record.city || target.city,
        category: categoryFromPlace(record, fallbackCategory),
        ...(validCoordinates(record.lat, record.lng)
          ? { lat: record.lat, lng: record.lng }
          : {}),
        images: images.length ? dedupeImages([...images, ...target.images]) : target.images,
        summary: record.description
          ? {
              ...target.summary,
              fr: target.summary.fr || record.description,
              en: target.summary.en || record.description,
            }
          : target.summary,
        description: record.description
          ? {
              ...target.description,
              fr: target.description.fr || record.description,
              en: target.description.en || record.description,
            }
          : target.description,
        origin: 'database',
      };
      continue;
    }

    const category = categoryFromPlace(record, 'autres');
    const images = dedupeImages(record.images || []);
    databaseOnly.push({
      id: `database-${record.id}`,
      name: record.name,
      category,
      city: record.city || 'Marrakech',
      ...(validCoordinates(record.lat, record.lng) ? { lat: record.lat, lng: record.lng } : {}),
      images: images.length ? images : [CATEGORY_META[category].image],
      summary: {
        fr: record.description || '',
        en: record.description || '',
        ar: '',
      },
      description: {
        fr: record.description || '',
        en: record.description || '',
        ar: '',
      },
      source: {},
      origin: 'database',
    });
  }

  return sortDestinations([...catalogue, ...databaseOnly], locale);
}

export function cityOptions(destinations: Destination[]): string[] {
  const cities = Array.from(new Set(destinations.map((place) => place.city).filter(Boolean)));
  const priority = ['Marrakech', 'Fès', 'Ouarzazate'];
  return cities.sort((a, b) => {
    const aIndex = priority.indexOf(a);
    const bIndex = priority.indexOf(b);
    if (aIndex !== -1 || bIndex !== -1) {
      return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
    }
    return a.localeCompare(b, 'fr');
  });
}

export function categoryPlaces(destinations: Destination[], category: CategoryKey): Destination[] {
  return destinations.filter((place) => place.category === category);
}

export const CATALOGUE_ATTRIBUTION =
  'Descriptions and photographs from Wikipedia and Wikimedia Commons (CC BY-SA).';
