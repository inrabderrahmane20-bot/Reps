// Marrakech neighborhoods mapped to geographic zones.
// Pure TS (no Node APIs) so it is safe to import from both server routes and
// client components. Zone centers are approximate district centroids used for
// nearest-zone matching and distance estimates — not addresses.

export interface Zone {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  neighborhoods: string[];
}

export const ZONES: Zone[] = [
  {
    id: 'gueliz',
    name: 'Guéliz',
    city: 'Marrakech',
    lat: 31.6345,
    lng: -8.012,
    neighborhoods: ['Guéliz', 'Gueliz'],
  },
  {
    id: 'hivernage',
    name: 'Hivernage',
    city: 'Marrakech',
    lat: 31.624,
    lng: -8.002,
    neighborhoods: ['Hivernage'],
  },
  {
    id: 'medina',
    name: 'Medina',
    city: 'Marrakech',
    lat: 31.6253,
    lng: -7.9881,
    neighborhoods: ['Medina', 'Médina'],
  },
  {
    id: 'semlalia',
    name: 'Semlalia',
    city: 'Marrakech',
    lat: 31.651,
    lng: -8.013,
    neighborhoods: ['Semlalia'],
  },
  {
    id: 'sidi-ghanem',
    name: 'Sidi Ghanem',
    city: 'Marrakech',
    lat: 31.667,
    lng: -8.032,
    neighborhoods: ['Sidi Ghanem'],
  },
  {
    id: 'sidi-youssef',
    name: 'Sidi Youssef Ben Ali',
    city: 'Marrakech',
    lat: 31.608,
    lng: -7.949,
    neighborhoods: ['Sidi Youssef Ben Ali', 'Sidi Youssef'],
  },
];

export function getZone(id: string | null | undefined): Zone | undefined {
  if (!id) return undefined;
  return ZONES.find((z) => z.id === id);
}

/** Great-circle distance in kilometers. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Assign any lat/lng to the nearest city zone centroid. */
export function nearestZoneId(lat: number, lng: number): string {
  let best = ZONES[0].id;
  let bestDist = Infinity;
  for (const z of ZONES) {
    const d = haversineKm(lat, lng, z.lat, z.lng);
    if (d < bestDist) {
      bestDist = d;
      best = z.id;
    }
  }
  return best;
}

/** Derive a zone id from a free-text neighborhood string (or null). */
export function zoneFromNeighborhood(name: string | null | undefined): string | null {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  const match = ZONES.find((z) => z.neighborhoods.some((n) => lower.includes(n.toLowerCase())));
  return match?.id ?? null;
}