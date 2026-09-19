// Taxonomy helpers used by the Services directory.
//
// Provider records carry a single concrete category (e.g. "Installation
// plomberie", "Plumbing"). The source taxonomy (src/data/service-taxonomy.json)
// is a 3-level tree (Top-level → Subcategory → Leaf service), so any node in
// that tree can be expanded into the set of concrete leaf categories that
// belong under it. The marketplace API uses this expansion for filtering.
//
// Pure TS (no Node APIs) so it is safe to import from both server routes and
// client components.

import taxonomyData from '@/data/service-taxonomy.json';

export interface TaxNode {
  name: string;
  children?: TaxNode[];
}

export const TAXONOMY = taxonomyData as TaxNode[];

/** Top-level group names, in the order they appear in the source taxonomy. */
export function topLevelCategories(): string[] {
  return TAXONOMY.map((node) => node.name);
}

/** Direct children of a top-level group (subcategories and/or leaf services). */
export function subcategoriesOf(top: string): TaxNode[] {
  const group = TAXONOMY.find((node) => normalize(node.name) === normalize(top));
  return group?.children ?? [];
}

/** All concrete leaf category names under a node. A node without children is itself a leaf. */
export function collectLeaves(node: TaxNode): string[] {
  if (!node.children || node.children.length === 0) return [node.name];
  return node.children.flatMap((child) => collectLeaves(child));
}

/**
 * Concretely find a node by name (top-level, subcategory or leaf), matching
 * case- and accent-insensitively.
 */
export function findNode(name: string): TaxNode | undefined {
  const target = normalize(name);
  const scan = (nodes: TaxNode[]): TaxNode | undefined => {
    for (const node of nodes) {
      if (normalize(node.name) === target) return node;
      if (node.children) {
        const found = scan(node.children);
        if (found) return found;
      }
    }
    return undefined;
  };
  return scan(TAXONOMY);
}

/**
 * Find the top-level group name a node belongs to (the node itself when it is
 * top-level). Used to keep the correct branch expanded when a subcategory is
 * selected.
 */
export function findParentTop(name: string): string | undefined {
  const target = normalize(name);
  const searchGroup = (group: TaxNode): boolean => {
    if (normalize(group.name) === target) return true;
    return (group.children ?? []).some(
      (child) => normalize(child.name) === target || searchGroup(child)
    );
  };
  return TAXONOMY.find((top) => searchGroup(top))?.name;
}

/**
 * Legacy seed categories that predate the taxonomy, mapped to their closest
 * taxonomy branches so directory filtering still finds them.
 */
const LEGACY_ALIASES: Record<string, string[]> = {
  plumbing: ['Plumbing'],
  electricite: ['Electricity'],
  electricity: ['Electricity'],
  cleaning: ['Cleaning'],
  photography: ['Photography'],
  painting: ['Painting'],
  moving: ['Moving'],
};

/**
 * Expand a user-selected category (top-level group, subcategory or single
 * service) into the concrete leaf category names that match it. Returns an
 * empty array when nothing matches, which callers treat as "filter matches
 * nothing".
 */
export function expandCategory(name: string): string[] {
  const target = normalize(name);

  const node = findNode(name);
  if (node) return collectLeaves(node);

  // English legacy categories map to their French taxonomy equivalents.
  if (LEGACY_ALIASES[target]) return LEGACY_ALIASES[target];

  // Unknown: fall back to a case/accent-insensitive exact match so any
  // category stored on a provider can still be selected directly.
  return [name];
}

/** Case- and accent-insensitive comparison key. */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/** Public helper exposed for callers that need the same normalization. */
export function normalizeCategory(value: string): string {
  return normalize(value);
}