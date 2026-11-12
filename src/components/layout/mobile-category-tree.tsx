'use client';

import Image from 'next/image';
import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUpRight, ChevronDown, ChevronRight, Minus, Plus } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { getCategoryLabel, type SearchCategoryNode } from '@/lib/category-tree';
import { categoryImage } from '@/lib/category-images';
import {
  homeRootHref,
  homeRootKind,
  homeSectionHref,
  type HomeRootKind,
} from '@/lib/home-categories';

const KIND_ORDER: HomeRootKind[] = ['services', 'community', 'places', 'for-sale'];

/** Root family matching a directory route, used to reopen the right branch. */
const KIND_BY_PATH: Record<string, HomeRootKind> = {
  '/services': 'services',
  '/communities': 'community',
  '/places': 'places',
  '/sell': 'for-sale',
};

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function kindForPath(pathname: string): HomeRootKind | null {
  const base = `/${pathname.split('/').filter(Boolean)[0] ?? ''}`;
  return KIND_BY_PATH[base] ?? null;
}

function findLabelPath(
  nodes: SearchCategoryNode[],
  target: string,
  trail: SearchCategoryNode[] = []
): SearchCategoryNode[] | null {
  const wanted = normalize(target);
  for (const node of nodes) {
    const nextTrail = [...trail, node];
    const matches = Object.values(node.labels ?? {}).some((label) => normalize(label) === wanted);
    if (matches) return nextTrail;
    if (node.children?.length) {
      const found = findLabelPath(node.children, target, nextTrail);
      if (found) return found;
    }
  }
  return null;
}

function categoryHref(kind: HomeRootKind | null, node: SearchCategoryNode): string {
  if (kind) return homeSectionHref(kind, node);
  return `/search?cat=${encodeURIComponent(node.labels.fr ?? node.id)}`;
}

function rootHref(kind: HomeRootKind | null, node: SearchCategoryNode): string {
  if (kind) return homeRootHref(kind);
  return `/search?cat=${encodeURIComponent(node.labels.fr ?? node.id)}`;
}

type TreeRowProps = {
  node: SearchCategoryNode;
  kind: HomeRootKind | null;
  depth: number;
  locale: string;
  currentLabel: string | null;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onNavigate: () => void;
};

/** One recursive row. Parents toggle; leaves navigate to their listing page. */
function TreeRow({
  node,
  kind,
  depth,
  locale,
  currentLabel,
  expanded,
  onToggle,
  onNavigate,
}: TreeRowProps) {
  const hasChildren = Boolean(node.children?.length);
  const isOpen = expanded.has(node.id);
  const label = getCategoryLabel(node, locale);
  const isCurrent = currentLabel ? normalize(currentLabel) === normalize(label) : false;
  const style = { '--tree-depth': depth } as CSSProperties;
  const image = categoryImage(node, kind ?? undefined);

  const content = (
    <>
      <span className="annabid-tree-thumb" aria-hidden>
        <Image src={image} alt="" fill sizes="32px" className="annabid-tree-thumb-img" />
      </span>
      <span className="annabid-tree-label">{label}</span>
      {hasChildren ? (
        <ChevronDown
          size={15}
          className={`annabid-tree-chevron flip-rtl${isOpen ? ' is-open' : ''}`}
          aria-hidden
        />
      ) : (
        <ChevronRight size={14} className="annabid-tree-chevron flip-rtl" aria-hidden />
      )}
    </>
  );

  if (!hasChildren) {
    return (
      <li>
        <Link
          href={categoryHref(kind, node)}
          onClick={onNavigate}
          className={`annabid-tree-row${isCurrent ? ' is-current' : ''}`}
          style={style}
          aria-current={isCurrent ? 'page' : undefined}
        >
          {content}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => onToggle(node.id)}
        className={`annabid-tree-row${isOpen ? ' is-open' : ''}${isCurrent ? ' is-current' : ''}`}
        style={style}
        aria-expanded={isOpen}
      >
        {content}
      </button>
      <div className={`annabid-tree-children${isOpen ? ' is-open' : ''}`} aria-hidden={!isOpen}>
        <div>
          <ul className="annabid-tree-list">
            {node.children?.map((child) => (
              <TreeRow
                key={child.id}
                node={child}
                kind={kind}
                depth={depth + 1}
                locale={locale}
                currentLabel={currentLabel}
                expanded={expanded}
                onToggle={onToggle}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}

/**
 * Live, recursive category browser for the mobile drawer.
 *
 * Main roots open as large photographic cards; every deeper level is the same
 * reusable row component, so the tree follows whatever depth the admin tree
 * contains. Only one root is open at a time, while nested branches can stay
 * open independently. Links reuse the same `?cat=` destination as the
 * homepage cards, so existing filters and routes keep working.
 */
export function MobileCategoryTree({
  categories,
  onNavigate,
}: {
  categories: SearchCategoryNode[];
  onNavigate: () => void;
}) {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();

  const roots = useMemo(
    () =>
      categories
        .map((node) => ({ node, kind: homeRootKind(node) }))
        .sort((a, b) => {
          const ai = a.kind ? KIND_ORDER.indexOf(a.kind) : KIND_ORDER.length;
          const bi = b.kind ? KIND_ORDER.indexOf(b.kind) : KIND_ORDER.length;
          return ai - bi;
        }),
    [categories]
  );

  const [openRoot, setOpenRoot] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [currentLabel, setCurrentLabel] = useState<string | null>(null);
  const initialized = useRef(false);

  // Reopen the branch that matches the current directory URL (and the exact
  // subcategory when `?cat=` is present). Runs once per drawer mount.
  useEffect(() => {
    if (initialized.current || roots.length === 0) return;
    initialized.current = true;

    const kind = kindForPath(pathname);
    const root = roots.find((entry) => entry.kind === kind)?.node;
    if (!root) return;

    const target =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('cat')
        : null;

    if (target) {
      const trail = findLabelPath(roots.map((entry) => entry.node), target);
      if (trail) {
        if (trail.length > 1) {
          setOpenRoot(trail[0].id);
          setExpanded(new Set(trail.slice(0, -1).map((node) => node.id)));
          setCurrentLabel(target);
        }
        return;
      }
    }

    setOpenRoot(root.id);
  }, [pathname, roots]);

  function toggleNode(id: string) {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const descriptions: Record<HomeRootKind, string> = {
    services: t('rootServicesDesc'),
    community: t('rootCommunityDesc'),
    places: t('rootPlacesDesc'),
    'for-sale': t('rootSaleDesc'),
  };

  return (
    <div className="annabid-tree">
      {roots.map(({ node, kind }) => {
        const id = node.id;
        const isOpen = openRoot === id;
        const label = getCategoryLabel(node, locale);
        const image = categoryImage(node, kind ?? undefined);
        const children = node.children ?? [];

        return (
          <div key={id} className={`annabid-tree-root${isOpen ? ' is-open' : ''}`}>
            <button
              type="button"
              className="annabid-tree-root-card"
              onClick={() => setOpenRoot((current) => (current === id ? null : id))}
              aria-expanded={isOpen}
            >
              <span className="annabid-tree-root-thumb" aria-hidden>
                <Image src={image} alt="" fill sizes="64px" className="annabid-tree-root-img" />
              </span>
              <span className="annabid-tree-root-copy">
                <span className="annabid-tree-root-title">{label}</span>
                {kind ? <span className="annabid-tree-root-desc">{descriptions[kind]}</span> : null}
              </span>
              <span className="annabid-tree-root-toggle" aria-hidden>
                {isOpen ? <Minus size={16} strokeWidth={2.4} /> : <Plus size={16} strokeWidth={2.4} />}
              </span>
            </button>

            <div className={`annabid-tree-panel${isOpen ? ' is-open' : ''}`} aria-hidden={!isOpen}>
              <div>
                {children.length ? (
                  <ul className="annabid-tree-list annabid-tree-list--root">
                    {children.map((child) => (
                      <TreeRow
                        key={child.id}
                        node={child}
                        kind={kind}
                        depth={0}
                        locale={locale}
                        currentLabel={currentLabel}
                        expanded={expanded}
                        onToggle={toggleNode}
                        onNavigate={onNavigate}
                      />
                    ))}
                  </ul>
                ) : null}
                <Link
                  href={rootHref(kind, node)}
                  onClick={onNavigate}
                  className="annabid-tree-see-all"
                >
                  {t('seeAllCategories')}
                  <ArrowUpRight size={15} className="flip-rtl" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
