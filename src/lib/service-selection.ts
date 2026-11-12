import type { SearchCategoryNode } from './category-tree';
import { normalizeCategory } from './service-categories';

/** Resolve stable IDs rather than labels that can be renamed or repeated. */
export function categoryPath(nodes: SearchCategoryNode[], id: string): SearchCategoryNode[] | null {
  for (const node of nodes) {
    if (node.id === id) return [node];
    const childPath = categoryPath(node.children ?? [], id);
    if (childPath) return [node, ...childPath];
  }
  return null;
}

/** Include categories assigned at any depth, not just terminal leaves. */
export function categoryBranchValues(node: SearchCategoryNode): Set<string> {
  const values = new Set([node.id, ...Object.values(node.labels)].map(normalizeCategory));
  for (const child of node.children ?? []) {
    for (const value of categoryBranchValues(child)) values.add(value);
  }
  return values;
}
