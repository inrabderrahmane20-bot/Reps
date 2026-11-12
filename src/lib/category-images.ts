import type { SearchCategoryNode } from '@/lib/category-tree';

/**
 * Category thumbnails for the homepage.
 *
 * Admins can override any category image from the category editor (the value
 * is stored on the category node). When no override exists we fall back to a
 * curated, locally-hosted photograph matched from the category slug/label.
 * Keeping the files in /public means the homepage never depends on a remote
 * host at runtime.
 */

const BASE = '/images/categories';

const IMAGE_BY_KEY: Record<string, string> = {
  services: `${BASE}/services.jpg`,
  community: `${BASE}/community.jpg`,
  communaute: `${BASE}/community.jpg`,
  places: `${BASE}/places.jpg`,
  'les-endroits': `${BASE}/places.jpg`,
  endroits: `${BASE}/places.jpg`,
  'for-sale': `${BASE}/for-sale.jpg`,
  'a-vendre': `${BASE}/for-sale.jpg`,
  vente: `${BASE}/for-sale.jpg`,

  technique: `${BASE}/service-technique.jpg`,
  appartement: `${BASE}/service-apartment.jpg`,
  maison: `${BASE}/service-house.jpg`,
  immeuble: `${BASE}/service-building.jpg`,
  automobile: `${BASE}/vehicules.jpg`,
  piscine: `${BASE}/piscines.jpg`,
  mecanicien: `${BASE}/vehicules.jpg`,
  cycliste: `${BASE}/velo.jpg`,
  decorateur: `${BASE}/hotels.jpg`,
  tadelakt: `${BASE}/hotels.jpg`,
  potier: `${BASE}/classes-et-ateliers.jpg`,
  animaux: `${BASE}/service-animals.jpg`,
  sport: `${BASE}/service-sport.jpg`,
  'beaute-et-bien-etre': `${BASE}/service-beauty.jpg`,

  'cours-et-education': `${BASE}/cours-et-education.jpg`,
  'partenaire-d-activite': `${BASE}/partenaire-activite.jpg`,
  enfants: `${BASE}/enfants.jpg`,
  'aide-a-domicile-et-personnes-agees': `${BASE}/aide-domicile-personnes-agees.jpg`,
  'classes-et-ateliers': `${BASE}/classes-et-ateliers.jpg`,
  evenements: `${BASE}/evenements.jpg`,

  'jardins-et-nature': `${BASE}/jardins-et-nature.jpg`,
  'monuments-historiques-et-patrimoine': `${BASE}/monuments-historiques-patrimoine.jpg`,
  'musees-et-culture': `${BASE}/musees-et-culture.jpg`,
  excursions: `${BASE}/excursions.jpg`,
  'experiences-a-faire': `${BASE}/experiences-a-faire.jpg`,
  cafes: `${BASE}/cafes.jpg`,
  restaurants: `${BASE}/restaurants.jpg`,
  parcs: `${BASE}/parcs.jpg`,
  piscines: `${BASE}/piscines.jpg`,
  hotels: `${BASE}/hotels.jpg`,
  'salles-de-sport': `${BASE}/salles-de-sport.jpg`,

  vehicules: `${BASE}/vehicules.jpg`,
  voiture: `${BASE}/voiture.jpg`,
  moto: `${BASE}/moto.jpg`,
  velo: `${BASE}/velo.jpg`,
  camion: `${BASE}/camion.jpg`,
  entikiter: `${BASE}/entikiter.jpg`,

  default: `${BASE}/default.jpg`,
};

type KeywordRule = [RegExp, string];

const KEYWORD_RULES: KeywordRule[] = [
  [/menuisi|carpenter|woodwork/i, `${BASE}/service-woodwork.jpg`],
  [/climatis|chauffage|chauffe-eau|air.condition/i, `${BASE}/service-climate.jpg`],
  [/coutur|styliste|tapissier|tailor|sewing/i, `${BASE}/service-sewing.jpg`],
  [/serrur|locksmith|lock/i, `${BASE}/service-locks.jpg`],
  [/peintr|peintre|painting/i, `${BASE}/service-painting.jpg`],
  [/soud|weld/i, `${BASE}/service-welding.jpg`],
  [/mecani|carross|reparation-auto/i, `${BASE}/vehicules.jpg`],
  [/potier|poterie/i, `${BASE}/classes-et-ateliers.jpg`],
  [/decorat|tadelakt|resine/i, `${BASE}/hotels.jpg`],
  [/jardin|majorelle|nature|palmeraie/i, `${BASE}/jardins-et-nature.jpg`],
  [/monument|patrimoine|koutoubia|medersa|palais|tombeau|kasbah|bab-/i, `${BASE}/monuments-historiques-patrimoine.jpg`],
  [/musee|museum|culture|photographie|ysl/i, `${BASE}/musees-et-culture.jpg`],
  [/excursion|desert|agafay|ourika|imlil|atlas/i, `${BASE}/excursions.jpg`],
  [/experience|the-a-la-menthe|fantasia|hammam|spa/i, `${BASE}/experiences-a-faire.jpg`],
  [/cafe|coffee/i, `${BASE}/cafes.jpg`],
  [/restaurant|cuisine|diner|food/i, `${BASE}/restaurants.jpg`],
  [/parc|menara|agdal/i, `${BASE}/parcs.jpg`],
  [/piscine|pool|riad/i, `${BASE}/piscines.jpg`],
  [/hotel|maison-d-hote/i, `${BASE}/hotels.jpg`],
  [/salle-de-sport|gym|fitness|musculation/i, `${BASE}/salles-de-sport.jpg`],
  [/enfant|garderie|nounou|ecole/i, `${BASE}/enfants.jpg`],
  [/personne|agee|domicile|aide|compagnie/i, `${BASE}/aide-domicile-personnes-agees.jpg`],
  [/atelier|classe|poterie|cuisine-marocaine|parfum/i, `${BASE}/classes-et-ateliers.jpg`],
  [/evenement|conference|theatre|festival|concert/i, `${BASE}/evenements.jpg`],
  [/cours|education|formation|langue/i, `${BASE}/cours-et-education.jpg`],
  [/partenaire|activite|velo|entrainement|tournoi/i, `${BASE}/partenaire-activite.jpg`],
  [/technique|electric|plomb|mecanicien|climatisation|serrur|peintre|menuisi/i, `${BASE}/service-technique.jpg`],
  [/animaux|animal|chien|chat|veterinaire/i, `${BASE}/service-animals.jpg`],
  [/sport|football|tennis|yoga|natation|equitation|combat/i, `${BASE}/service-sport.jpg`],
  [/beaute|bien-etre|coiffeur|barbier|maquillage|manucure|pedicure/i, `${BASE}/service-beauty.jpg`],
  [/vehicule|voiture|automobile|car|moto|scooter|camion|velo/i, `${BASE}/vehicules.jpg`],
  [/entikiter|marche|souk|poterie|artisanat|vente/i, `${BASE}/entikiter.jpg`],
  [/service|prestataire|metier/i, `${BASE}/services.jpg`],
  [/communaute|community|groupe|voisin/i, `${BASE}/community.jpg`],
  [/endroit|place|lieu|visite/i, `${BASE}/places.jpg`],
];

/** Accent/case/punctuation-insensitive key used for image matching. */
export function categoryImageKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function resolvedFallback(fallbackKey?: string): string | undefined {
  if (!fallbackKey) return undefined;
  const direct = IMAGE_BY_KEY[fallbackKey];
  if (direct) return direct;
  return IMAGE_BY_KEY[categoryImageKey(fallbackKey)];
}

/**
 * Resolve the photograph for a category card. Admin-provided images always
 * win, then stable slugs/labels, then keyword matching, then the section
 * fallback, then a neutral Marrakech image.
 */
export function categoryImage(
  node: Pick<SearchCategoryNode, 'id' | 'slug' | 'labels' | 'image'> | null | undefined,
  fallbackKey?: string
): string {
  const custom = node?.image?.trim();
  if (custom) return custom;

  const candidates = [
    node?.slug,
    node?.id,
    node?.labels?.fr,
    node?.labels?.en,
    node?.labels?.ar,
  ].filter((value): value is string => Boolean(value?.trim()));

  const keys = candidates.map(categoryImageKey);
  for (const key of keys) {
    if (IMAGE_BY_KEY[key]) return IMAGE_BY_KEY[key];
  }

  const haystack = candidates.join(' ');
  for (const [pattern, image] of KEYWORD_RULES) {
    if (pattern.test(haystack)) return image;
  }

  return resolvedFallback(fallbackKey) ?? IMAGE_BY_KEY.default;
}
