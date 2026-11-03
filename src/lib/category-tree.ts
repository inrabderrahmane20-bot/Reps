import categoryTaxonomy from '@/data/category-taxonomy.json';
import type { CategoryNode } from '@/lib/types';

export type SearchCategoryNode = {
  id: string;
  slug: string;
  labels: Record<string, string>;
  children?: SearchCategoryNode[];
};

type CategoryDataNode = {
  name: string;
  children?: CategoryDataNode[];
};

export function slugifyCategory(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function createCategoryNode(
  node: CategoryDataNode,
  parentId = ''
): SearchCategoryNode {
  const slug = slugifyCategory(node.name);
  const id = parentId ? `${parentId}.${slug}` : slug;
  const children = node.children?.map((child) => createCategoryNode(child, id));

  return {
    id,
    slug,
    labels: { fr: node.name, en: node.name, ar: node.name },
    ...(children?.length ? { children } : {}),
  };
}

export const SEARCH_CATEGORIES: SearchCategoryNode[] = (
  categoryTaxonomy as CategoryDataNode[]
).map((node) => createCategoryNode(node));

export function categoryNodesToTree(categories: CategoryNode[]): SearchCategoryNode[] {
  const nodes = [...categories].sort((a, b) => a.order - b.order);
  const byParent = new Map<string | null, CategoryNode[]>();
  for (const node of nodes) {
    const siblings = byParent.get(node.parentId) ?? [];
    siblings.push(node);
    byParent.set(node.parentId, siblings);
  }

  const buildChildren = (parentId: string | null, ancestors: Set<string>): SearchCategoryNode[] =>
    (byParent.get(parentId) ?? []).map((node) => {
      if (ancestors.has(node.id)) {
        throw new Error(`Category hierarchy contains a cycle at "${node.id}".`);
      }
      const nextAncestors = new Set(ancestors);
      nextAncestors.add(node.id);
      const children = buildChildren(node.id, nextAncestors);
      return {
        id: node.id,
        slug: node.slug,
        labels: node.labels,
        ...(children.length ? { children } : {}),
      };
    });

  const tree = buildChildren(null, new Set());
  const included = new Set<string>();
  const collectIds = (branch: SearchCategoryNode[]) => {
    for (const node of branch) {
      included.add(node.id);
      collectIds(node.children ?? []);
    }
  };
  collectIds(tree);
  if (included.size !== categories.length) {
    throw new Error('Category hierarchy contains a missing parent or duplicate ID.');
  }
  return tree;
}

export function categoryTreeToNodes(tree: SearchCategoryNode[]): CategoryNode[] {
  const records: CategoryNode[] = [];
  const visit = (nodes: SearchCategoryNode[], parentId: string | null) => {
    nodes.forEach((node, order) => {
      records.push({
        id: node.id,
        parentId,
        slug: slugifyCategory(node.labels.fr),
        type: 'category',
        labels: node.labels,
        order,
        active: true,
      });
      visit(node.children ?? [], node.id);
    });
  };
  visit(tree, null);
  return records;
}

export function getCategoryLabel(node: SearchCategoryNode, locale: string): string {
  return node.labels[locale] ?? node.labels.fr ?? node.id;
}
