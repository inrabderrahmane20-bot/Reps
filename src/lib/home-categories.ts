import type { SearchCategoryNode } from '@/lib/category-tree';

export type HomeRootKind = 'services' | 'community' | 'places' | 'for-sale';

export type HomeSection = {
  kind: HomeRootKind;
  root: SearchCategoryNode;
  items: SearchCategoryNode[];
};

function key(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Map a live admin root category to one of the four homepage discovery
 * families. Names are matched loosely so admin renames (in any locale) keep
 * working, while the stable taxonomy slug/id remains the primary signal.
 */
export function homeRootKind(node: SearchCategoryNode): HomeRootKind | null {
  const haystack = key([
    node.id,
    node.slug,
    node.labels.fr,
    node.labels.en,
    node.labels.ar,
  ].join(' '));

  if (/\bservices?\b|prestataire|metier/.test(haystack)) return 'services';
  if (/communaute|community|communities/.test(haystack)) return 'community';
  if (/endroit|place|lieu|visite/.test(haystack)) return 'places';
  if (/vendre|vente|for-sale|for sale|sell|marketplace/.test(haystack)) return 'for-sale';
  return null;
}

export function homeRootHref(kind: HomeRootKind): string {
  switch (kind) {
    case 'services':
      return '/services';
    case 'community':
      return '/communities';
    case 'places':
      return '/places';
    case 'for-sale':
      return '/sell';
  }
}

/**
 * Category cards shown inside a section. Places normally has a single
 * "ENDROITS À VISITER" wrapper — we open it so the homepage surfaces the
 * actual families instead of one giant card. For sale is expanded one level
 * so vehicles and their concrete children appear alongside ENTIKITER.
 */
export function homeSectionItems(
  root: SearchCategoryNode,
  kind: HomeRootKind,
  limit = 6
): SearchCategoryNode[] {
  let items = root.children ?? [];

  if (kind === 'places' && items.length === 1 && items[0].children?.length) {
    items = items[0].children;
  }

  if (kind === 'for-sale' && items.length < limit) {
    const expanded = items.flatMap((item) => [item, ...(item.children ?? [])]);
    if (expanded.length > items.length) items = expanded;
  }

  return items.slice(0, limit);
}

export function homeSectionHref(kind: HomeRootKind, node: SearchCategoryNode): string {
  const category = encodeURIComponent(node.labels.fr ?? node.id);
  switch (kind) {
    case 'services':
      return `/services?cat=${category}`;
    case 'community':
      return `/communities?cat=${category}`;
    case 'places':
      return `/places?cat=${category}`;
    case 'for-sale':
      return `/sell?cat=${category}`;
  }
}

/** Number of concrete leaves below a category (itself when it is a leaf). */
export function countCategoryLeaves(node: SearchCategoryNode): number {
  if (!node.children?.length) return 1;
  return node.children.reduce((total, child) => total + countCategoryLeaves(child), 0);
}

export function homeSections(tree: SearchCategoryNode[]): HomeSection[] {
  const sections: HomeSection[] = [];
  for (const root of tree) {
    const kind = homeRootKind(root);
    if (!kind) continue;
    sections.push({
      kind,
      root,
      items: homeSectionItems(root, kind),
    });
  }
  return sections;
}
