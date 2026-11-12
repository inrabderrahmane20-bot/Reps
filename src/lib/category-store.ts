import { categoryNodesToTree, categoryTreeToNodes, SEARCH_CATEGORIES, type SearchCategoryNode } from '@/lib/category-tree';
import { readCategoryState, updateDb } from '@/lib/db';

export async function getCategoryTree(): Promise<SearchCategoryNode[]> {
  const { categories, categoryTreeInitialized } = await readCategoryState();
  return categoryTreeInitialized || categories.length
    ? categoryNodesToTree(categories)
    : SEARCH_CATEGORIES;
}

export async function saveCategoryTree(tree: SearchCategoryNode[]): Promise<void> {
  const previousTree = await getCategoryTree();
  const records = categoryTreeToNodes(tree);
  const previousNodeCounts = countNodeLabels(previousTree);
  const nextNodeCounts = countNodeLabels(tree);
  const nextNodes = new Map(collectNodesById(tree).map((node) => [node.id, node.label]));
  const renamedNodes = new Map<string, string>();

  for (const previous of collectNodesById(previousTree)) {
    const nextLabel = nextNodes.get(previous.id);
    if (
      nextLabel &&
      nextLabel !== previous.label &&
      previousNodeCounts.get(previous.label) === 1 &&
      nextNodeCounts.get(nextLabel) === 1
    ) {
      renamedNodes.set(previous.label, nextLabel);
    }
  }

  await updateDb((db) => {
    for (const user of db.users) {
      const currentCategory = user.provider?.category;
      const renamedCategory = currentCategory ? renamedNodes.get(currentCategory) : undefined;
      if (user.provider && renamedCategory) user.provider.category = renamedCategory;
    }
    db.categories = records;
    db.categoryTreeInitialized = true;
  });
}

function collectNodesById(tree: SearchCategoryNode[]): { id: string; label: string }[] {
  return tree.flatMap((node) => {
    return [{ id: node.id, label: node.labels.fr }, ...collectNodesById(node.children ?? [])];
  });
}

function countNodeLabels(tree: SearchCategoryNode[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const { label } of collectNodesById(tree)) {
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return counts;
}
