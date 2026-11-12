import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { withErrors, jsonError } from '@/lib/api-helpers';
import { getCategoryTree, saveCategoryTree } from '@/lib/category-store';
import type { SearchCategoryNode } from '@/lib/category-tree';

export const dynamic = 'force-dynamic';

export async function GET() {
  return withErrors(async () => {
    await requireAdmin();
    return NextResponse.json({ categories: await getCategoryTree() });
  });
}

export async function PUT(req: NextRequest) {
  return withErrors(async () => {
    await requireAdmin();
    const body: unknown = await req.json();
    const validationError = validateCategoryTree(body);
    if (validationError) return jsonError(validationError);

    const categories = normalizeCategoryTree(
      (body as { categories: SearchCategoryNode[] }).categories
    );
    await saveCategoryTree(categories);
    return NextResponse.json({ categories });
  });
}

function validateCategoryTree(value: unknown): string | null {
  if (!value || typeof value !== 'object' || !('categories' in value)) {
    return 'A categories tree is required.';
  }
  const categories = (value as { categories: unknown }).categories;
  if (!Array.isArray(categories)) return 'Categories must be a list.';

  const ids = new Set<string>();
  let count = 0;
  const visit = (nodes: unknown[], depth = 0): string | null => {
    if (depth > 50) return 'Categories cannot be nested more than 50 levels deep.';
    for (const candidate of nodes) {
      count += 1;
      if (count > 2000) return 'The category tree cannot contain more than 2,000 categories.';
      if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
        return 'Each category must be an object.';
      }

      const node = candidate as Record<string, unknown>;
      if (typeof node.id !== 'string' || !node.id.trim() || node.id !== node.id.trim() || node.id.length > 512) {
        return 'Each category must have a valid ID.';
      }
      if (ids.has(node.id)) return `Category ID "${node.id}" is used more than once.`;
      ids.add(node.id);

      if (!node.labels || typeof node.labels !== 'object' || Array.isArray(node.labels)) {
        return `Category "${node.id}" must have labels.`;
      }
      const labels = node.labels as Record<string, unknown>;
      if (typeof labels.fr !== 'string' || !labels.fr.trim() || labels.fr.trim().length > 200) {
        return `Category "${node.id}" needs a French label of 1–200 characters.`;
      }
      for (const locale of ['en', 'ar']) {
        if (labels[locale] !== undefined && (typeof labels[locale] !== 'string' || labels[locale].length > 200)) {
          return `Category "${node.id}" has an invalid ${locale} label.`;
        }
      }
      if (node.children !== undefined && !Array.isArray(node.children)) {
        return `Category "${node.id}" has an invalid children list.`;
      }
      if (
        node.image !== undefined &&
        (typeof node.image !== 'string' || node.image.trim().length > 2048)
      ) {
        return `Category "${node.id}" has an invalid image URL.`;
      }
      const childError = visit((node.children as unknown[] | undefined) ?? [], depth + 1);
      if (childError) return childError;
    }
    return null;
  };

  return visit(categories);
}

function normalizeCategoryTree(nodes: SearchCategoryNode[]): SearchCategoryNode[] {
  return nodes.map((node) => {
    const frenchLabel = node.labels.fr.trim();
    const labels = {
      fr: frenchLabel,
      en: node.labels.en?.trim() || frenchLabel,
      ar: node.labels.ar?.trim() || frenchLabel,
    };
    const children = normalizeCategoryTree(node.children ?? []);
    return {
      id: node.id.trim(),
      slug: frenchLabel
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
      labels,
      ...(node.image?.trim() ? { image: node.image.trim() } : {}),
      ...(children.length ? { children } : {}),
    };
  });
}
