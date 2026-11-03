import { categoryNodesToTree, categoryTreeToNodes, SEARCH_CATEGORIES, type SearchCategoryNode } from '@/lib/category-tree';
import { readDb, updateDb } from '@/lib/db';

export function getCategoryTree(): SearchCategoryNode[] {
  const db = readDb();
  return db.categoryTreeInitialized || db.categories.length
    ? categoryNodesToTree(db.categories)
    : SEARCH_CATEGORIES;
}

export function saveCategoryTree(tree: SearchCategoryNode[]): void {
  const previousTree = getCategoryTree();
  const records = categoryTreeToNodes(tree);
  const previousLeafCounts = countLeafLabels(previousTree);
  const nextLeafCounts = countLeafLabels(tree);
  const nextLeaves = new Map(collectLeavesById(tree).map((node) => [node.id, node.label]));
  const renamedLeaves = new Map<string, string>();

  for (const previous of collectLeavesById(previousTree)) {
    const nextLabel = nextLeaves.get(previous.id);
    if (
      nextLabel &&
      nextLabel !== previous.label &&
      previousLeafCounts.get(previous.label) === 1 &&
      nextLeafCounts.get(nextLabel) === 1
    ) {
      renamedLeaves.set(previous.label, nextLabel);
    }
  }

  updateDb((db) => {
    for (const user of db.users) {
      const currentCategory = user.provider?.category;
      const renamedCategory = currentCategory ? renamedLeaves.get(currentCategory) : undefined;
      if (user.provider && renamedCategory) user.provider.category = renamedCategory;
    }
    db.categories = records;
    db.categoryTreeInitialized = true;
  });
}

function collectLeavesById(tree: SearchCategoryNode[]): { id: string; label: string }[] {
  return tree.flatMap((node) => {
    if (!node.children?.length) return [{ id: node.id, label: node.labels.fr }];
    return collectLeavesById(node.children);
  });
}

function countLeafLabels(tree: SearchCategoryNode[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const { label } of collectLeavesById(tree)) {
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return counts;
}
