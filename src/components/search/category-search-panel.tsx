'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { SEARCH_CATEGORIES, getCategoryLabel, type SearchCategoryNode } from '@/lib/category-tree';
import { useRouter } from 'next/navigation';

type PathNode = SearchCategoryNode & { depth: number };

interface CategorySearchPanelProps {
  open: boolean;
  onClose: () => void;
}

export function CategorySearchPanel({ open, onClose }: CategorySearchPanelProps) {
  const t = useTranslations('search');
  const locale = useLocale();
  const router = useRouter();
  const [path, setPath] = useState<PathNode[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) {
      setPath([]);
      setQuery('');
    }
  }, [open]);

  const currentLevel = useMemo(() => {
    if (path.length === 0) return SEARCH_CATEGORIES;
    const parent = path[path.length - 1];
    return parent.children || [];
  }, [path]);

  const breadcrumbs = path;

  function goTo(node: SearchCategoryNode) {
    const newPath = [...path, { ...node, depth: path.length + 1 }];
    setPath(newPath);
    // If leaf (no children), navigate to results
    if (!node.children || node.children.length === 0) {
      const trail = [...path, node].map((n) => n.slug).join('/');
      router.push(`/${locale}/search?catPath=${encodeURIComponent(trail)}`);
      onClose();
    }
  }

  function goBack() {
    if (path.length === 0) return;
    setPath(path.slice(0, -1));
  }

  function goHome() {
    setPath([]);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-sand-50 md:items-center md:justify-center md:p-4">
      <div className="mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden md:h-[80vh] md:rounded-3xl md:border md:border-ink-900/10 md:bg-white md:shadow-float">
        <header className="flex items-center gap-2 border-b border-ink-900/[0.06] px-4 py-3">
          <button
            type="button"
            onClick={goBack}
            disabled={path.length === 0}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-600 transition-colors hover:bg-sand-100 disabled:opacity-40"
            aria-label="Back"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('placeholder')}
              className="w-full rounded-full border border-ink-900/10 bg-sand-50 py-2 pe-9 ps-9 text-sm outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute end-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-ink-400 hover:text-ink-900"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-600 transition-colors hover:bg-sand-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        {breadcrumbs.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-b border-ink-900/[0.04] px-4 py-2 text-sm text-ink-500">
            <button type="button" onClick={goHome} className="hover:text-ink-900">
              {t('title')}
            </button>
            {breadcrumbs.map((crumb, idx) => (
              <span key={crumb.id} className="flex items-center gap-1.5">
                <ChevronRight size={14} className="text-ink-300" />
                <button
                  type="button"
                  onClick={() => setPath(breadcrumbs.slice(0, idx + 1))}
                  className={idx === breadcrumbs.length - 1 ? 'font-medium text-ink-900' : 'hover:text-ink-900'}
                >
                  {getCategoryLabel(crumb, locale)}
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {currentLevel
              .filter((n) => {
                if (!query.trim()) return true;
                const label = getCategoryLabel(n, locale).toLowerCase();
                return label.includes(query.toLowerCase());
              })
              .map((node) => (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => goTo(node)}
                  className="flex items-center justify-between rounded-2xl border border-ink-900/[0.06] bg-white px-4 py-3 text-start shadow-card transition-colors hover:border-sunset-200 hover:bg-peach-50/40"
                >
                  <span className="text-sm font-semibold text-ink-900">{getCategoryLabel(node, locale)}</span>
                  {(node.children && node.children.length > 0) && <ChevronRight size={16} className="text-ink-400" />}
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
