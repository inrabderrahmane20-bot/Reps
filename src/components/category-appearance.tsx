'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { Grid2X2, Wrench, PawPrint, Dumbbell, Sparkles, Users, MapPin, Car, Home, TreePine, Utensils, GraduationCap, Heart, ShoppingBag } from 'lucide-react';
import type { CategoryAppearance } from '@/lib/category-appearance';

const icons = { Grid: Grid2X2, Wrench, PawPrint, Dumbbell, Sparkles, Users, MapPin, Car, Home, TreePine, Utensils, GraduationCap, Heart, ShoppingBag };
const CategoryAppearanceContext = createContext<ReadonlyMap<string, CategoryAppearance>>(new Map());

export function CategoryAppearanceProvider({ value = [], children }: { value?: CategoryAppearance[]; children: ReactNode }) {
  const settings = useMemo(() => new Map(value.map(entry => [entry.categoryId, entry])), [value]);
  return <CategoryAppearanceContext.Provider value={settings}>{children}</CategoryAppearanceContext.Provider>;
}

export function useCategoryAppearance() { return useContext(CategoryAppearanceContext); }

export function CategoryMobileIcon({ categoryId }: { categoryId: string }) {
  const setting = useCategoryAppearance().get(categoryId);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (setting?.mobileSize !== 'icon') return null;
  const Icon = icons[setting.icon] ?? Grid2X2;
  return <span className="category-mobile-icon" aria-hidden="true">
    {setting.iconSrc && setting.iconSrc !== failedSrc
      ? <Image src={setting.iconSrc} alt="" fill sizes="32px" onError={() => setFailedSrc(setting.iconSrc)} />
      : <Icon size={32} strokeWidth={1.7} />}
  </span>;
}
