import { safeUrl } from './visual-editor/sanitize';

export const CATEGORY_ICONS = ['Grid', 'Wrench', 'PawPrint', 'Dumbbell', 'Sparkles', 'Users', 'MapPin', 'Car', 'Home', 'TreePine', 'Utensils', 'GraduationCap', 'Heart', 'ShoppingBag'] as const;
export type CategoryIconName = typeof CATEGORY_ICONS[number];
export type CategoryAppearance = {
  categoryId: string;
  mobileSize: 'regular' | 'icon';
  icon: CategoryIconName;
  iconSrc: string;
};

/** Page-local settings use stable category IDs; category images remain untouched. */
export function sanitizeCategoryAppearance(value: unknown): CategoryAppearance[] {
  if (!Array.isArray(value) || value.length > 500) throw new Error('Choose at most 500 category appearances.');
  const ids = new Set<string>();
  return value.map(entry => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)
      || typeof entry.categoryId !== 'string' || !entry.categoryId.trim() || entry.categoryId.length > 500
      || ids.has(entry.categoryId) || !['regular', 'icon'].includes(entry.mobileSize)
      || !CATEGORY_ICONS.includes(entry.icon) || typeof entry.iconSrc !== 'string') {
      throw new Error('Invalid category appearance.');
    }
    ids.add(entry.categoryId);
    return { categoryId: entry.categoryId, mobileSize: entry.mobileSize, icon: entry.icon, iconSrc: safeUrl(entry.iconSrc, true) };
  });
}
