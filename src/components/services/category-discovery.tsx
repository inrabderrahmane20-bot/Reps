'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import {
  Baby,
  BedDouble,
  CalendarDays,
  Car,
  Check,
  Compass,
  Dumbbell,
  GraduationCap,
  HandHeart,
  Landmark,
  LayoutGrid,
  PawPrint,
  Sparkles,
  Trees,
  UtensilsCrossed,
  Waves,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { categoryImage } from '@/lib/category-images';
import { getCategoryLabel, type SearchCategoryNode } from '@/lib/category-tree';

const ICON_RULES: { pattern: RegExp; Icon: LucideIcon }[] = [
  { pattern: /techni|plomb|electric|mecani|clim|serrur|peintr|menuisi|bricol/i, Icon: Wrench },
  { pattern: /anim|chien|chat|veterin/i, Icon: PawPrint },
  { pattern: /sport|football|tennis|yoga|natation|equitation|combat|fitness/i, Icon: Dumbbell },
  { pattern: /beaute|bien-etre|coiffeur|barbier|maquillage|manucure|spa/i, Icon: Sparkles },
  { pattern: /cours|educa|ecole|atelier|formation/i, Icon: GraduationCap },
  { pattern: /aide|domicile|personne|senior|enfance/i, Icon: HandHeart },
  { pattern: /enfant|bebe|nounou/i, Icon: Baby },
  { pattern: /cafe|restaurant|traiteur|cuisine/i, Icon: UtensilsCrossed },
  { pattern: /hotel|riad|maison|hebergement/i, Icon: BedDouble },
  { pattern: /jardin|parc|nature|plante/i, Icon: Trees },
  { pattern: /musee|culture|monument|patrimoine|histor/i, Icon: Landmark },
  { pattern: /evenement|fete|mariage|anniversaire/i, Icon: CalendarDays },
  { pattern: /excursion|voyage|tour|guide/i, Icon: Compass },
  { pattern: /piscine|plage|mer/i, Icon: Waves },
  { pattern: /vehicule|voiture|moto|scooter|camion|auto/i, Icon: Car },
];

function categoryIcon(node: SearchCategoryNode): LucideIcon {
  const haystack = [node.slug, node.id, node.labels?.fr, node.labels?.en].join(' ');
  return ICON_RULES.find((rule) => rule.pattern.test(haystack))?.Icon ?? LayoutGrid;
}


/**
 * Photographic category discovery grid. Cards always come from the live
 * category tree (admin-managed) and never from a hardcoded list.
 */
export function CategoryDiscovery({
  categories,
  title,
  subtitle,
  selected,
  onSelect,
}: {
  categories: SearchCategoryNode[];
  title?: string;
  subtitle?: string;
  selected: string | null;
  onSelect: (category: string | null) => void;
}) {
  const t = useTranslations('services');
  const locale = useLocale();

  return (
    <section aria-labelledby="svc-explore-heading">
      <div className="flex flex-col items-center text-center">
        <span className="mb-3 text-emerald-primary" aria-hidden>
          <Ornament />
        </span>
        <h2
          id="svc-explore-heading"
          className="font-display text-[1.7rem] font-semibold leading-tight text-typography-main sm:text-[2.1rem]"
        >
          {title ?? t('exploreTitle')}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-typography-main/60 sm:text-[15px]">
          {subtitle ?? t('exploreSubtitle')}
        </p>
      </div>

      <div className="svc-category-grid mt-7">
        {categories.map((node, index) => {
          const label = getCategoryLabel(node, locale);
          const active = selected === node.id;
          const Icon = categoryIcon(node);
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => onSelect(node.id)}
              aria-pressed={active}
              className="svc-cat-card"
            >
              <span className="svc-cat-media">
                <Image
                  src={categoryImage(node, 'services')}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 46vw, (max-width: 1023px) 44vw, (max-width: 1279px) 22vw, 280px"
                  priority={index < 4}
                  className="svc-cat-img"
                />
              </span>
              {active && (
                <span className="svc-cat-check" aria-hidden>
                  <Check size={15} strokeWidth={3} />
                </span>
              )}
              <span className="svc-cat-label">
                <Icon size={15} strokeWidth={2} aria-hidden />
                <span>{label}</span>
              </span>
            </button>
          );
        })}
      </div>

    </section>
  );
}

function Ornament() {
  return (
    <svg width="54" height="20" viewBox="0 0 54 20" fill="none" aria-hidden>
      <path d="M1 10h14" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.55" />
      <path d="M39 10h14" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.55" />
      <path d="M27 3l7 7-7 7-7-7 7-7z" stroke="currentColor" strokeWidth="1.1" />
      <path d="M27 7l3 3-3 3-3-3 3-3z" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

/** Thin geometric rule used between the major services-page sections. */
export function MoroccanDivider() {
  return <div className="moroccan-divider svc-original-divider" aria-hidden="true" />;
}
