'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { BadgeCheck, List, LayoutGrid, MapPin, Rows3 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Rating } from '@/components/ui/rating';
import { AvailabilityBadge, type Availability } from '@/components/ui/availability-badge';
import { getZone } from '@/lib/zones';
import type { PromotionInfo } from '@/lib/types';
import { PromotionBadge, PromoPrice, SponsoredTag } from './marketing-badges';

/** Enriched provider row as displayed across all service view modes. */
export interface ServiceListing {
  id: string;
  name: string;
  category: string;
  title: string;
  rating: number | null;
  reviewCount: number;
  availability: Availability;
  distanceKm: number | null;
  verified: boolean;
  avatar: string;
  description?: string;
  priceRange?: string;
  portfolio?: string[];
  zoneId?: string;
  /** True while the sponsorship window is active (server-computed). */
  sponsored?: boolean;
  /** Where the paid campaign is allowed to appear (server-computed). */
  sponsoredPlacement?: 'home' | 'services' | 'both';
  /** Destination the paid campaign points at, when the admin set one. */
  sponsoredHref?: string;
  /** The promotion while it is active; null otherwise (server-computed). */
  promotion?: PromotionInfo | null;
}

/** Available view modes: list, grid, large. */
export type ViewMode = 'list' | 'grid' | 'large';

const VIEW_MODES: { mode: ViewMode; icon: typeof List; labelKey: 'viewList' | 'viewGrid' | 'viewLarge' }[] = [
  { mode: 'list', icon: List, labelKey: 'viewList' },
  { mode: 'grid', icon: LayoutGrid, labelKey: 'viewGrid' },
  { mode: 'large', icon: Rows3, labelKey: 'viewLarge' },
];

export function ViewSwitcher({\n  value,\n  onChange,\n  allowLarge = false,\n  className = '',\n}: {\n  value: ViewMode;\n  onChange: (mode: ViewMode) => void;\n  allowLarge?: boolean;\n  className?: string;\n}) {\n  const t = useTranslations('services');\n  const modes = VIEW_MODES.filter((m) => allowLarge || m.mode !== 'large');\n  return (\n    <div\n      role=\"group\"\n      aria-label={t('viewMode')}\n      className={`inline-flex items-center gap-0.5 rounded-full border border-gold-muted bg-card-soft p-0.5 ${className}`}\n    >\n      {modes.map(({ mode, icon: Icon, labelKey }) => {\n        const active = value === mode;\n        return (\n          <button\n            key={mode}\n            type=\"button\"\n            onClick={() => onChange(mode)}\n            aria-pressed={active}\n            aria-label={t(labelKey)}\n            title={t(labelKey)}\n            className={`grid h-8 w-9 place-items-center rounded-full transition-colors ${
              active ? 'bg-emerald-primary text-white shadow-sm' : 'text-typography-main hover:bg-beige-secondary hover:text-typography-main'\n}`}\n          >\n            <Icon size={16} strokeWidth={active ? 2.4 : 2} />\n          </button>\n        );\n      })}\n    </div>\n  );
}