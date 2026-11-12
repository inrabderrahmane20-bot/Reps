'use client';

import { cloneElement, isValidElement, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { Render, type Config, type Data } from '@measured/puck';
import type { Locale } from '@/i18n/config';
import type { DocumentId } from '@/lib/visual-editor/types';
import { layoutBlocks } from './layout-blocks';
import { contentBlocks } from './content-blocks';
import { globalBlocks } from './global-blocks';

export function visualConfig(id: DocumentId, locale: Locale, previewPath?: string): Config {
  const globals = globalBlocks(locale, previewPath);
  const globalType = id === 'navbar' ? 'Navbar' : 'Footer';
  return {
    root: { fields: {}, defaultProps: {}, render: ({ children, puck }: { children: ReactNode; puck?: { isEditing?: boolean } }) => {
      // Puck's root div must not become the sticky Navbar's containing block.
      if (!puck?.isEditing && isValidElement(children)) return cloneElement(children as ReactElement<{ style?: CSSProperties }>, { style: { display: 'contents' } });
      return <>{children}</>;
    } },
    categories: { global: { title: 'Existing component', components: [globalType] }, layout: { title: 'Layout', components: Object.keys(layoutBlocks) }, content: { title: 'Content', components: Object.keys(contentBlocks) } },
    components: { [globalType]: globals[globalType], ...layoutBlocks, ...contentBlocks },
  };
}
export function PublishedVisualDocument({ id, locale, data }: { id: DocumentId; locale: Locale; data: Data }) {
  return <Render config={visualConfig(id, locale)} data={data} />;
}
