export const OPEN_CATEGORY_SEARCH_EVENT = 'medina:open-category-search';

export function openCategorySearch() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(OPEN_CATEGORY_SEARCH_EVENT));
}
