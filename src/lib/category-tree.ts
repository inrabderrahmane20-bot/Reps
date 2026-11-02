import categoryTaxonomy from '@/data/category-taxonomy.json';

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

function slugify(label: string): string {
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
  const slug = slugify(node.name);
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

export function getCategoryLabel(node: SearchCategoryNode, locale: string): string {
  return node.labels[locale] ?? node.labels.fr ?? node.id;
}
