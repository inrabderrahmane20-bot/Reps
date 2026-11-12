'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { SEARCH_CATEGORIES, type SearchCategoryNode } from '@/lib/category-tree';
import { api } from '@/lib/api-client';
import { CategoryTreeBrowser } from './category-tree-browser';

interface CategorySearchPanelProps {
  open: boolean;
  onClose: () => void;
}

export function CategorySearchPanel({ open, onClose }: CategorySearchPanelProps) {
  const locale = useLocale();
  const router = useRouter();
  const [categories, setCategories] = useState<SearchCategoryNode[]>(SEARCH_CATEGORIES);
  useEffect(() => {
    if (!open) return;
    let active = true;
    api.get<{ categories: SearchCategoryNode[] }>('/categories/tree')
      .then(response => { if (active) setCategories(response.categories); })
      .catch(error => console.error('Could not load the current category tree.', error));
    return () => { active = false; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-sand-50 md:items-center md:justify-center md:p-4">
      <div className="mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden md:h-[80vh] md:rounded-3xl md:border md:border-ink-900/10 md:bg-white md:shadow-float">
        <CategoryTreeBrowser categories={categories} onClose={onClose} onSelect={(_node, path) => {
          router.push(`/${locale}/search?catPath=${encodeURIComponent(path.map(node => node.slug).join('/'))}`);
          onClose();
        }} />
      </div>
    </div>
  );
}
