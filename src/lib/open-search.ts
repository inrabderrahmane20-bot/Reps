// Tiny bridge so any component (navbar, footer, …) can open the global
// floating search without importing the component itself.

export const OPEN_SEARCH_EVENT = 'reps:open-search';

/** Open the floating search overlay (client side only). */
export function openGlobalSearch(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT));
}
