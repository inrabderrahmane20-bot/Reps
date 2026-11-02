// Localization helpers for the service taxonomy.
//
// The shared category taxonomy is authored in French. To keep the Services
// directory readable in Arabic and English, top-level families map to keys in
// the next-intl `categories` namespace.

/** Top-level taxonomy name (French) → message key under `categories`. */
export const CATEGORY_MESSAGE_KEYS: Record<string, string> = {
  TECHNIQUE: 'technique',
  SPORT: 'sport',
  'BEAUTÉ ET BIEN-ÊTRE': 'beauteBienEtre',
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
  TECHNIQUE: '🛠️',
  SPORT: '🏅',
  'BEAUTÉ ET BIEN-ÊTRE': '💇',
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
