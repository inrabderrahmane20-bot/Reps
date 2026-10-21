// Localization helpers for the service taxonomy.
//
// The taxonomy itself (`src/data/service-taxonomy.json`) is authored in French
// — it is the canonical source of truth for the catalogue and is used as-is by
// the API. To keep the interface readable in Arabic and English we map every
// top-level family to a translation key that lives in the next-intl message
// files (`categories.*`).

/** Top-level taxonomy name (French) → message key under `categories`. */
export const CATEGORY_MESSAGE_KEYS: Record<string, string> = {
  'MAISON & BÂTIMENT': 'maisonBatiment',
  'NETTOYAGE & ENTRETIEN': 'nettoyageEntretien',
  'JARDIN & EXTÉRIEUR': 'jardinExterieur',
  'AUTOMOBILE & MOTO': 'automobileMoto',
  'INFORMATIQUE & TECHNOLOGIE': 'informatiqueTechnologie',
  'SERVICES À DOMICILE': 'servicesDomicile',
  'BEAUTÉ & BIEN-ÊTRE': 'beauteBienEtre',
  'MODE & ARTISANAT': 'modeArtisanat',
  'MARIAGE & ÉVÉNEMENTS': 'mariageEvenements',
  'CUISINE & ALIMENTATION': 'cuisineAlimentation',
  'TRANSPORT & LOGISTIQUE': 'transportLogistique',
  'SÉCURITÉ': 'securite',
  'ÉDUCATION & FORMATION': 'educationFormation',
  ANIMAUX: 'animaux',
  'LOCATION DE MATÉRIEL': 'locationMateriel',
  'DÉPANNAGE URGENT': 'depannageUrgent',
  'SERRURERIE & VITRERIE': 'serrurerieVitrerie',
  ÉLECTROMÉNAGER: 'electromenager',
  'MEUBLES & DÉCORATION': 'meublesDecoration',
  'ENTREPRISES & PROFESSIONNELS': 'entreprisesProfessionnels',
  'AUTRES SERVICES': 'autresServices',
};

/** Decorative emoji per family — purely visual, never the only signal. */
export const CATEGORY_ICONS: Record<string, string> = {
  'MAISON & BÂTIMENT': '🏠',
  'NETTOYAGE & ENTRETIEN': '🧹',
  'JARDIN & EXTÉRIEUR': '🌿',
  'AUTOMOBILE & MOTO': '🚗',
  'INFORMATIQUE & TECHNOLOGIE': '💻',
  'SERVICES À DOMICILE': '🏡',
  'BEAUTÉ & BIEN-ÊTRE': '💇',
  'MODE & ARTISANAT': '🧵',
  'MARIAGE & ÉVÉNEMENTS': '💍',
  'CUISINE & ALIMENTATION': '🍽️',
  'TRANSPORT & LOGISTIQUE': '🚚',
  'SÉCURITÉ': '🔐',
  'ÉDUCATION & FORMATION': '📚',
  ANIMAUX: '🐾',
  'LOCATION DE MATÉRIEL': '🛠️',
  'DÉPANNAGE URGENT': '🚨',
  'SERRURERIE & VITRERIE': '🔑',
  ÉLECTROMÉNAGER: '🔌',
  'MEUBLES & DÉCORATION': '🛋️',
  'ENTREPRISES & PROFESSIONNELS': '💼',
  'AUTRES SERVICES': '🧰',
};

/** Message key for a top-level family, or undefined when unknown. */
export function categoryMessageKey(name: string): string | undefined {
  return CATEGORY_MESSAGE_KEYS[name.trim()];
}

/** Icon for a top-level family (falls back to a generic tool). */
export function categoryIcon(name: string): string {
  return CATEGORY_ICONS[name.trim()] ?? '🧰';
}
