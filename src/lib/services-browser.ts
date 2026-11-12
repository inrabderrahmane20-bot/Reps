import type { SearchCategoryNode } from './category-tree';
import { homeSections } from './home-categories';
import { categoryPath } from './service-selection';

export function serviceRoots(tree: SearchCategoryNode[]): SearchCategoryNode[] {
  return homeSections(tree).find(section => section.kind === 'services')?.root.children ?? [];
}
export function defaultServiceRoot(roots: SearchCategoryNode[]): SearchCategoryNode | undefined {
  return roots.find(node => /technique|technical/i.test([node.slug,node.id,node.labels.fr,node.labels.en].join(' '))) ?? roots[0];
}
function categorySegment(node: SearchCategoryNode, siblings: SearchCategoryNode[]): string {
  const slug=node.slug || node.id;
  return siblings.filter(candidate=>(candidate.slug || candidate.id)===slug).length>1 ? `${slug}--${node.id}` : slug;
}
export function serviceCategoryHref(roots: SearchCategoryNode[], id: string): string {
  const path=categoryPath(roots,id);
  if(!path) return '/services';
  let siblings=roots;
  const segments=path.map(node=>{const segment=categorySegment(node,siblings);siblings=node.children??[];return encodeURIComponent(segment);});
  return `/services/categories/${segments.join('/')}/`;
}
export function resolveServiceCategory(roots: SearchCategoryNode[], slugs: string[]): SearchCategoryNode[] | null {
  const path:SearchCategoryNode[]=[];
  let level=roots;
  for(const slug of slugs) {
    const node=level.find(node=>categorySegment(node,level)===slug);
    if(!node) return null;
    path.push(node);level=node.children??[];
  }
  return path.length ? path : null;
}
export function flattenServiceCategories(nodes: SearchCategoryNode[]): SearchCategoryNode[] {
  return nodes.flatMap(node => [node,...flattenServiceCategories(node.children ?? [])]);
}
export function normalizedSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().trim();
}
export function matchesCategory(node: SearchCategoryNode, query: string): boolean {
  const key = normalizedSearch(query);
  return !key || Object.values(node.labels).some(label => normalizedSearch(label).includes(key)) || Boolean(node.children?.some(child => matchesCategory(child,query)));
}
export type CategorySearchCounts = Record<string, number>;
export function branchSearchCount(node: SearchCategoryNode, counts: CategorySearchCounts): number {
  return (counts[node.id] ?? 0) + (node.children ?? []).reduce((sum,child) => sum + branchSearchCount(child,counts),0);
}
