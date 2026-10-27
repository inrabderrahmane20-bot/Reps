'use client';

import { useEffect, useState } from 'react';
import { CategorySearchPanel } from './category-search-panel';
import { OPEN_CATEGORY_SEARCH_EVENT } from '@/lib/open-category-search';

export function CategorySearchRoot() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_CATEGORY_SEARCH_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CATEGORY_SEARCH_EVENT, onOpen);
  }, []);

  return <CategorySearchPanel open={open} onClose={() => setOpen(false)} />;
}
