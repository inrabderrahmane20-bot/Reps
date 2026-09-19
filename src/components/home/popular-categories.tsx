'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { topLevelCategories } from '@/lib/service-categories';

/** Emoji shortcut per top-level category (fallback 🔧). */
const CATEGORY_ICONS: Record<string, string> = {
  'MAISON & BÂTIMENT': '🏠',
  'NETTOYAGE & ENTRETIEN': '🧹',
  'JARDIN & EXTÉRIEUR': '🌿',
  'AUTOMOBILE & MOTO': '🚗',
  'INFORMATIQUE & TECHNOLOGIE': '💻',
  'SERVICES À DOMICILE': '🏡',
  'BEAUTÉ & BIEN-ÊTRE': '💇‍♀️',
  'MODE & ARTISANAT': '🧵',
  'MARIAGE & ÉVÉNEMENTS': '👰',
  'CUISINE & ALIMENTATION': '🍽️',
  'SÉCURITÉ': '🔐',
  'SANTÉ & BIEN-ÊTRE': '🩺',
  'ÉDUCATION & COURS': '📚',
  'SPORT & FITNESS': '🏃',
  'LOISIRS & CULTURE': '🎨',
  'VOYAGE & TRANSPORT': '✈️',
  'IMMOBILIER': '🏢',
  'ASSISTANCE & ADMINISTRATIF': '👨‍💼',
  'ANIMAUX': '🐾',
  'PHOTOGRAPHIE': '📷',
  'AUTRES SERVICES': '🔧',
};

/**
 * Quick category shortcuts under the hero search. Each chip deep-links to the
 * Services page with that category pre-selected (`/services?cat=…`).
 */
export function PopularCategories() {
  const t = useTranslations('home');
  const cats = topLevelCategories().slice(0, 8);
  return (
    <nav aria-label={t('sectionPopularCategories')} className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {cats.map((cat) => (
        <Link
          key={cat}
          href={`/services?cat=${encodeURIComponent(cat)}`}
          className="group flex items-center gap-2.5 rounded-2xl border border-ink-900/[0.06] bg-white px-3.5 py-3 shadow-card transition-all hover:-translate-y-0.5 hover:border-majorelle-400 hover:shadow-float"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sand-100 text-lg transition-colors group-hover:bg-majorelle-600/10" aria-hidden>
            {CATEGORY_ICONS[cat] || '🔧'}
          </span>
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink-800 transition-colors group-hover:text-majorelle-700">
            {cat}
          </span>
        </Link>
      ))}
    </nav>
  );
}