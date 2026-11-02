'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { normalizeCategory, TAXONOMY, type TaxNode } from '@/lib/service-categories';

export function LayeredCategoryNavigation({
  open,
  selectedCategory,
  onSelectCategory,
  onClose,
}: {
  open: boolean;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  onClose: () => void;
}) {
  const t = useTranslations('services');
  const locale = useLocale();
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const [entered, setEntered] = useState(false);
  const [path, setPath] = useState<TaxNode[]>([]);
  const [enteringLayer, setEnteringLayer] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const selectedStatus = selectedCategory
    ? t('categorySelection', { category: selectedCategory })
    : t('noCategorySelected');

  useEffect(() => {
    if (open) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      setMounted(true);
      setClosing(false);
      setEntered(false);
      setPath(selectedCategory ? findBrowsePath(selectedCategory) : []);
      animationFrameRef.current = window.requestAnimationFrame(() => setEntered(true));
      window.requestAnimationFrame(() => closeButtonRef.current?.focus());
      return () => {
        if (animationFrameRef.current !== null) {
          window.cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }

    if (!mounted) return;
    setClosing(true);
    setEntered(false);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timeout = window.setTimeout(
      () => {
        setMounted(false);
        setClosing(false);
      },
      reducedMotion ? 0 : 520
    );
    return () => window.clearTimeout(timeout);
  }, [open, mounted, selectedCategory]);

  useEffect(() => {
    if (!mounted) {
      if (!open) returnFocusRef.current?.focus();
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted, open]);

  const layers = useMemo(() => {
    const levels: TaxNode[][] = [TAXONOMY];
    for (const node of path) levels.push(node.children ?? []);
    return levels;
  }, [path]);

  const desktopCoverage = layers.length === 1 ? 1 : 1 - 1 / 3 ** (layers.length - 1);
  const previousLayerFraction =
    layers.length === 1 ? 1 : layers.length === 2 ? 1 / 3 : 0.52 / (layers.length - 1);
  const activeLayerFraction = layers.length === 1 ? 1 : 1 - previousLayerFraction * (layers.length - 1);
  const desktopColumns = [
    ...Array.from({ length: layers.length - 1 }, () => '1fr'),
    `${activeLayerFraction / previousLayerFraction}fr`,
  ].join(' ');

  function showLayer(index: number) {
    setEnteringLayer(false);
    setPath((current) => current.slice(0, index));
  }

  function navigateFromLayer(index: number, node: TaxNode) {
    if (!node.children?.length) {
      onSelectCategory(node.name);
      onClose();
      return;
    }

    setPath((current) => [...current.slice(0, index), node]);
  }

  function openNextLayer(node: TaxNode) {
    if (!node.children?.length) {
      onSelectCategory(node.name);
      onClose();
      return;
    }

    setPath((current) => [...current, node]);
    setEnteringLayer(true);
    window.requestAnimationFrame(() => setEnteringLayer(false));
  }

  function selectAllCategories() {
    onSelectCategory(null);
    onClose();
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || path.length === 0) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (deltaX > 72 && deltaX > Math.abs(deltaY) * 1.4) {
      event.preventDefault();
      showLayer(path.length - 1);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
  }

  if (!mounted) return null;

  const isRtl = locale === 'ar';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-ink-900/35 p-3 backdrop-blur-[2px] transition-opacity duration-500 motion-reduce:transition-none sm:p-4"
      style={{ opacity: entered && !closing ? 1 : 0 }}
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('categories')}
        dir={isRtl ? 'rtl' : 'ltr'}
        className="relative h-[calc(100dvh-24px)] w-[calc(100vw-24px)] max-w-[1500px] touch-pan-y transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:h-[92dvh] sm:w-[94vw]"
        style={{
          transform: entered && !closing ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.97)',
          opacity: entered && !closing ? 1 : 0,
        }}
        onClick={(event) => event.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="absolute inset-y-0 start-0 hidden grid-flow-col gap-2 transition-[width,grid-template-columns] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:grid"
          style={{
            width: `${desktopCoverage * 100}%`,
            gridTemplateColumns: desktopColumns,
            direction: isRtl ? 'rtl' : 'ltr',
          }}
        >
          {layers.map((nodes, index) => {
            const isActive = index === path.length;
            const title = index === 0 ? t('categories') : path[index - 1].name;

            return (
              <section
                key={`desktop-${index}-${path.slice(0, index).map((node) => node.name).join('/')}`}
                className={`flex min-w-0 flex-col overflow-hidden rounded-[26px] border border-ink-900/10 transition-[background-color,box-shadow,opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                  isActive
                    ? 'bg-sand-50 shadow-[0_24px_70px_rgba(35,25,20,0.26)]'
                    : 'bg-white/95 shadow-[0_16px_44px_rgba(35,25,20,0.16)]'
                }`}
                style={{
                  opacity: isActive ? 1 : Math.max(0.55, 0.92 - (path.length - index - 1) * 0.08),
                  transform: isActive && enteringLayer ? 'translateY(12px) scale(0.985)' : 'translateY(0) scale(1)',
                  zIndex: index + 1,
                }}
              >
                <header className={`shrink-0 border-b border-ink-900/[0.07] ${isActive ? 'bg-white/90' : 'bg-white/75'} px-3 py-4 xl:px-5`}>
                  <div className="flex items-start gap-2">
                    {isActive && path.length > 0 && (
                      <button
                        type="button"
                        onClick={() => showLayer(path.length - 1)}
                        aria-label={t('backToPreviousLevel')}
                        className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ink-900/[0.08] bg-white text-ink-600 transition-colors hover:bg-sand-100"
                      >
                        <ChevronLeft size={17} className="flip-rtl" aria-hidden />
                      </button>
                    )}
                    <div className="min-w-0 flex-1">
                      {isActive && (
                        <nav aria-label={t('categories')} className="mb-1 flex min-w-0 items-center gap-1 overflow-x-auto whitespace-nowrap text-[11px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          <button
                            type="button"
                            onClick={() => showLayer(0)}
                            className={path.length === 0 ? 'font-semibold text-ink-900' : 'text-ink-500 hover:text-ink-900'}
                          >
                            {t('categories')}
                          </button>
                          {path.map((node, crumbIndex) => (
                            <span key={`${node.name}-${crumbIndex}`} className="flex shrink-0 items-center gap-1">
                              <ChevronRight size={12} className="flip-rtl text-ink-300" aria-hidden />
                              <button
                                type="button"
                                onClick={() => showLayer(crumbIndex + 1)}
                                className={crumbIndex === path.length - 1 ? 'max-w-[9vw] truncate font-semibold text-ink-900' : 'max-w-[9vw] truncate text-ink-500 hover:text-ink-900'}
                              >
                                {node.name}
                              </button>
                            </span>
                          ))}
                        </nav>
                      )}
                      <h2 className={`truncate font-display font-semibold text-ink-900 ${isActive ? 'text-xl xl:text-2xl' : 'text-base xl:text-lg'}`}>
                        {title}
                      </h2>
                      {isActive && (
                        <p className="mt-0.5 hidden truncate text-xs text-ink-500 xl:block">
                          {t('categoryBrowseHint')}
                        </p>
                      )}
                    </div>
                    {isActive && (
                      <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('closeCategoryNavigation')}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-500 transition-colors hover:bg-sand-100 hover:text-ink-900"
                      >
                        <X size={18} aria-hidden />
                      </button>
                    )}
                  </div>
                </header>

                <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${isActive ? 'px-4 py-4 xl:px-5 xl:py-5' : 'px-2 py-3 xl:px-3'}`}>
                  <div className={`grid gap-2 ${isActive ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
                    {index === 0 && (
                      <button
                        type="button"
                        onClick={selectAllCategories}
                        aria-pressed={selectedCategory === null}
                        className={`flex min-h-[46px] min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-start transition-colors ${
                          selectedCategory === null
                            ? 'border-majorelle-300 bg-majorelle-600/[0.06] text-ink-900'
                            : 'border-ink-900/[0.07] bg-white text-ink-800 hover:border-majorelle-200'
                        } ${isActive ? 'xl:col-span-2' : ''}`}
                      >
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{t('allCategories')}</span>
                        {selectedCategory === null && <Check size={15} className="shrink-0 text-majorelle-700" aria-hidden />}
                      </button>
                    )}
                    {nodes.map((node, nodeIndex) => {
                      const hasChildren = Boolean(node.children?.length);
                      const selected = !hasChildren
                        && selectedCategory !== null
                        && normalizeCategory(selectedCategory) === normalizeCategory(node.name);

                      return (
                        <button
                          key={`${node.name}-${nodeIndex}`}
                          type="button"
                          onClick={() => navigateFromLayer(index, node)}
                          aria-pressed={selected}
                          className={`group flex min-h-[46px] min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-start transition-colors ${
                            selected
                              ? 'border-majorelle-300 bg-majorelle-600/[0.06] text-ink-900'
                              : 'border-ink-900/[0.07] bg-white text-ink-800 hover:border-majorelle-200 hover:bg-white'
                          }`}
                        >
                          <span className={`min-w-0 flex-1 text-sm font-semibold leading-snug ${isActive ? '' : 'truncate'}`}>
                            {node.name}
                          </span>
                          {hasChildren ? (
                            <ChevronRight size={15} className="flip-rtl shrink-0 text-ink-400" aria-hidden />
                          ) : selected ? (
                            <Check size={15} className="shrink-0 text-majorelle-700" aria-hidden />
                          ) : null}
                        </button>
                      );
                    })}
                    {nodes.length === 0 && (
                      <p className="rounded-xl border border-dashed border-ink-900/10 px-3 py-6 text-center text-xs text-ink-500">
                        {t('noCategoriesAvailable')}
                      </p>
                    )}
                  </div>
                </div>

                <footer className="shrink-0 border-t border-ink-900/[0.07] bg-white/80 px-3 py-3 text-[11px] text-ink-500 xl:px-5">
                  {selectedCategory ? t('categorySelection', { category: selectedCategory }) : t('noCategorySelected')}
                </footer>
              </section>
            );
          })}
        </div>

        <div className="absolute inset-0 md:hidden">
        {layers.map((nodes, index) => {
          const depth = path.length - index;
          const title = index === 0 ? t('categories') : path[index - 1].name;
          const scale = Math.max(0.78, 1 - depth * 0.05);
          const translateX = depth === 0 ? 0 : (isRtl ? 1 : -1) * Math.min(depth * 8, 64);
          const translateY = depth === 0 ? 0 : -Math.min(depth * 28, 84);
          const isActive = depth === 0;
          const transform = isActive && enteringLayer
            ? 'translate3d(0, 22px, 0) scale(0.97)'
            : `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;

          if (!isActive) {
            return (
              <div
                key={`${index}-${path.slice(0, index).map((node) => node.name).join('/')}`}
                role="button"
                tabIndex={0}
                aria-label={title}
                className="absolute inset-0 overflow-hidden rounded-[26px] border border-ink-900/10 bg-white shadow-[0_24px_70px_rgba(35,25,20,0.22)] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                style={{
                  transform,
                  opacity: Math.max(0.18, 1 - depth * 0.16),
                  zIndex: index + 1,
                }}
                onClick={() => showLayer(index)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    showLayer(index);
                  }
                }}
              >
                <div className="border-b border-ink-900/[0.06] px-5 py-5 sm:px-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-400">
                    {t('categories')}
                  </p>
                  <p className="mt-1 font-display text-lg font-semibold text-ink-700">{title}</p>
                </div>
              </div>
            );
          }

          return (
            <section
              key={`${index}-${path.slice(0, index).map((node) => node.name).join('/')}`}
              className="absolute inset-0 flex flex-col overflow-hidden rounded-[26px] border border-ink-900/10 bg-sand-50 shadow-[0_24px_70px_rgba(35,25,20,0.26)] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
              style={{ transform, opacity: 1, zIndex: index + 1 }}
            >
              <header className="shrink-0 border-b border-ink-900/[0.07] bg-white/90 px-4 py-4 sm:px-8 sm:py-5">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => path.length > 0 && showLayer(path.length - 1)}
                    disabled={path.length === 0}
                    aria-label={t('backToPreviousLevel')}
                    className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink-900/[0.08] bg-white text-ink-600 transition-colors hover:bg-sand-100 disabled:opacity-40"
                  >
                    <ChevronLeft size={19} className="flip-rtl" aria-hidden />
                  </button>

                  <div className="min-w-0 flex-1">
                    <nav aria-label={t('categories')} className="mb-1 flex min-w-0 items-center gap-1 overflow-x-auto whitespace-nowrap text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      <button
                        type="button"
                        onClick={() => showLayer(0)}
                        className={path.length === 0 ? 'font-semibold text-ink-900' : 'text-ink-500 hover:text-ink-900'}
                      >
                        {t('categories')}
                      </button>
                      {path.map((node, crumbIndex) => (
                        <span key={`${node.name}-${crumbIndex}`} className="flex shrink-0 items-center gap-1">
                          <ChevronRight size={13} className="flip-rtl text-ink-300" aria-hidden />
                          <button
                            type="button"
                            onClick={() => showLayer(crumbIndex + 1)}
                            className={crumbIndex === path.length - 1 ? 'max-w-[35vw] truncate font-semibold text-ink-900 sm:max-w-none' : 'max-w-[35vw] truncate text-ink-500 hover:text-ink-900 sm:max-w-none'}
                          >
                            {node.name}
                          </button>
                        </span>
                      ))}
                    </nav>
                    <h2 className="truncate font-display text-xl font-semibold text-ink-900 sm:text-2xl">
                      {title}
                    </h2>
                    <p className="mt-0.5 truncate text-xs text-ink-500 sm:text-sm">
                      {t('categoryBrowseHint')}
                    </p>
                  </div>

                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={onClose}
                    aria-label={t('closeCategoryNavigation')}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-500 transition-colors hover:bg-sand-100 hover:text-ink-900"
                  >
                    <X size={20} aria-hidden />
                  </button>
                </div>
              </header>

              <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-4 py-4 sm:px-8 sm:py-6">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {index === 0 && (
                    <button
                      type="button"
                      onClick={selectAllCategories}
                      aria-pressed={selectedCategory === null}
                      className={`flex min-h-[58px] items-center gap-3 rounded-2xl border px-4 py-3 text-start transition-colors ${
                        selectedCategory === null
                          ? 'border-majorelle-300 bg-majorelle-600/[0.06] text-ink-900'
                          : 'border-ink-900/[0.07] bg-white text-ink-800 hover:border-majorelle-200 hover:bg-white'
                      }`}
                    >
                      <span className="min-w-0 flex-1 text-sm font-semibold">{t('allCategories')}</span>
                      {selectedCategory === null && <Check size={17} className="shrink-0 text-majorelle-700" aria-hidden />}
                    </button>
                  )}

                  {nodes.map((node, nodeIndex) => {
                    const hasChildren = Boolean(node.children?.length);
                    const selected = !hasChildren
                      && selectedCategory !== null
                      && normalizeCategory(selectedCategory) === normalizeCategory(node.name);

                    return (
                      <button
                        key={`${node.name}-${nodeIndex}`}
                        type="button"
                        onClick={() => openNextLayer(node)}
                        aria-pressed={selected}
                        aria-expanded={hasChildren ? false : undefined}
                        className={`group flex min-h-[58px] items-center gap-3 rounded-2xl border px-4 py-3 text-start transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 ${
                          selected
                            ? 'border-majorelle-300 bg-majorelle-600/[0.06] text-ink-900'
                            : 'border-ink-900/[0.07] bg-white text-ink-800 hover:border-majorelle-200 hover:bg-white'
                        }`}
                      >
                        <span className="min-w-0 flex-1 text-sm font-semibold leading-snug">{node.name}</span>
                        {hasChildren ? (
                          <ChevronRight size={17} className="flip-rtl shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5" aria-hidden />
                        ) : selected ? (
                          <Check size={17} className="shrink-0 text-majorelle-700" aria-hidden />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                {nodes.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-ink-900/10 bg-white/60 px-4 py-8 text-center text-sm text-ink-500">
                    {t('noCategoriesAvailable')}
                  </p>
                )}
              </div>

              <footer className="shrink-0 border-t border-ink-900/[0.07] bg-white/85 px-5 py-3.5 text-xs text-ink-500 sm:px-8">
                {selectedStatus}
              </footer>
            </section>
          );
        })}
      </div>
      </div>
    </div>
  );
}

function findBrowsePath(name: string): TaxNode[] {
  const target = normalizeCategory(name);
  const findPath = (nodes: TaxNode[], ancestors: TaxNode[]): TaxNode[] | null => {
    for (const node of nodes) {
      const currentPath = [...ancestors, node];
      if (normalizeCategory(node.name) === target) {
        return node.children?.length ? currentPath : currentPath.slice(0, -1);
      }
      if (node.children?.length) {
        const found = findPath(node.children, currentPath);
        if (found) return found;
      }
    }
    return null;
  };

  return findPath(TAXONOMY, []) ?? [];
}
