'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { getCategoryLabel, type SearchCategoryNode } from '@/lib/category-tree';

/** Shared by the navbar modal and the inline services browser. */
export function CategoryTreeBrowser({ categories, initialPath = [], rootLabel, onSelect, onNavigate, onClose }: {
  categories: SearchCategoryNode[];
  initialPath?: string[];
  rootLabel?: string;
  onSelect: (node: SearchCategoryNode, path: SearchCategoryNode[]) => void;
  onNavigate?: (path: SearchCategoryNode[]) => void;
  onClose?: () => void;
}) {
  const t = useTranslations('search');
  const ui = useTranslations('services');
  const locale = useLocale();
  const [pathIds, setPathIds] = useState(initialPath);
  const [query, setQuery] = useState('');
  const { path, currentLevel } = useMemo(() => {
    const path: SearchCategoryNode[] = [];
    let currentLevel = categories;
    for (const id of pathIds) {
      const node = currentLevel.find(candidate => candidate.id === id);
      if (!node?.children?.length) break;
      path.push(node);
      currentLevel = node.children;
    }
    return { path, currentLevel };
  }, [categories, pathIds]);
  const visible = currentLevel.filter(node => getCategoryLabel(node, locale).toLocaleLowerCase(locale).includes(query.trim().toLocaleLowerCase(locale)));
  function navigate(next: SearchCategoryNode[]) {
    setPathIds(next.map(node => node.id));
    setQuery('');
    onNavigate?.(next);
  }
  function goTo(node: SearchCategoryNode) {
    if (node.children?.length) navigate([...path, node]);
    else onSelect(node, [...path, node]);
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col" data-category-tree-browser="true">
      <header className="flex items-center gap-2 border-b border-ink-900/[0.06] px-4 py-3">
        <button type="button" onClick={() => navigate(path.slice(0, -1))} disabled={!path.length}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-600 transition-colors hover:bg-sand-100 disabled:opacity-40" aria-label={ui('backToPreviousLevel')}>
          <ChevronLeft size={18} className="flip-rtl" />
        </button>
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder={t('placeholder')} aria-label={t('placeholder')}
            className="w-full rounded-full border border-ink-900/10 bg-sand-50 py-2 pe-9 ps-9 text-sm outline-none" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label={ui('clearSearch')}
            className="absolute end-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-ink-400 hover:text-ink-900"><X size={14} /></button>}
        </div>
        {onClose && <button type="button" onClick={onClose} aria-label={ui('closeCategoryNavigation')}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-600 transition-colors hover:bg-sand-100"><X size={18} /></button>}
      </header>
      {path.length > 0 && <nav aria-label={rootLabel ?? t('title')} className="flex flex-wrap items-center gap-1.5 border-b border-ink-900/[0.04] px-4 py-2 text-sm text-ink-500">
        <button type="button" onClick={() => navigate([])} className="hover:text-ink-900">{rootLabel ?? t('title')}</button>
        {path.map((crumb, index) => <span key={crumb.id} className="flex items-center gap-1.5">
          <ChevronRight size={14} className="flip-rtl text-ink-300" />
          <button type="button" onClick={() => navigate(path.slice(0, index + 1))}
            className={index === path.length - 1 ? 'font-medium text-ink-900' : 'hover:text-ink-900'}>{getCategoryLabel(crumb, locale)}</button>
        </span>)}
      </nav>}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {visible.map(node => <button key={node.id} type="button" onClick={() => goTo(node)} data-category-id={node.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-ink-900/[0.06] bg-white px-4 py-3 text-start shadow-card transition-colors hover:border-sunset-200 hover:bg-peach-50/40">
            <span className="text-sm font-semibold text-ink-900">{getCategoryLabel(node, locale)}</span>
            {Boolean(node.children?.length) && <ChevronRight size={16} className="flip-rtl shrink-0 text-ink-400" />}
          </button>)}
        </div>
      </div>
    </div>
  );
}
