'use client';

import { cloneElement, isValidElement, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { Render, type Config, type Data } from '@measured/puck';
import type { Locale } from '@/i18n/config';
import type { DocumentId } from '@/lib/visual-editor/types';
import { layoutBlocks } from './layout-blocks';
import { contentBlocks } from './content-blocks';
import { legalBlocks } from './legal-blocks';
import { LEGAL_DEFAULTS } from '@/lib/visual-editor/defaults';
import { homeBlocks, HomeCanvas } from './home-blocks';
import { servicesBlocks, ServicesCanvas } from './page-blocks';
import type { SearchCategoryNode } from '@/lib/category-tree';
import { globalBlocks } from './global-blocks';
import { CategoryAppearanceProvider } from '@/components/category-appearance';
import type { CategoryAppearance } from '@/lib/category-appearance';
import { categoryAppearanceField } from './category-appearance-field';

export function visualConfig(id: DocumentId, locale: Locale, previewPath?: string, initialCategories?: SearchCategoryNode[], initialCategoryId?: string): Config {
  const globals = globalBlocks(locale, previewPath);
  const globalType = id === 'navbar' ? 'Navbar' : 'Footer';
  const existing = LEGAL_DEFAULTS[id] ? legalBlocks(id) : id === 'home' ? homeBlocks(locale) : id === 'services' ? servicesBlocks(locale) : { [globalType]: globals[globalType] };
  return {
    root: { fields: id === 'home' || id === 'services' ? { categoryAppearance: categoryAppearanceField(id, locale) } : {}, defaultProps: {}, render: ({ children, puck, categoryAppearance }: { children: ReactNode; puck?: { isEditing?: boolean }; categoryAppearance?: CategoryAppearance[] }) => {
      if (id === 'services' || id === 'home') {
        const pageChildren = isValidElement(children) ? cloneElement(children as ReactElement<{className?: string}>, {className: id === 'home' ? 'home-redesign' : 'moroccan-canvas svc-page min-h-screen pb-16'}) : children;
        return <CategoryAppearanceProvider value={categoryAppearance}>{id === 'home' ? <HomeCanvas editorChildren={pageChildren} /> : <ServicesCanvas initialCategories={initialCategories} initialCategoryId={initialCategoryId}>{pageChildren}</ServicesCanvas>}</CategoryAppearanceProvider>;
      }
      // Puck's root div must not become the sticky Navbar's containing block.
      if (!puck?.isEditing && isValidElement(children)) return cloneElement(children as ReactElement<{ style?: CSSProperties }>, { style: { display: 'contents' } });
      return <>{children}</>;
    } },
    categories: { global: { title: 'Existing component', components: Object.keys(existing) }, layout: { title: 'Layout', components: Object.keys(layoutBlocks) }, content: { title: 'Content', components: Object.keys(contentBlocks) } },
    components: { ...existing, ...layoutBlocks, ...contentBlocks },
  };
}
export function PublishedVisualDocument({ id, locale, data, initialCategories, initialCategoryId }: { id: DocumentId; locale: Locale; data: Data; initialCategories?: SearchCategoryNode[]; initialCategoryId?: string }) {
  return <Render config={visualConfig(id, locale, undefined, initialCategories, initialCategoryId)} data={data} />;
}
