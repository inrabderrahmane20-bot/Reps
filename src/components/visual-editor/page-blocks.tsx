'use client';
import type { ComponentConfig } from '@measured/puck';
import ServicesClient from '@/app/[locale]/services/services-client';
import { MoroccanDivider } from '@/components/services/category-discovery';
import { LivePageSection } from './page-context';
import { blockStyle, styleFields, VisualTypography } from './style-fields';
import { imageField } from './content-blocks';
import type { SearchCategoryNode } from '@/lib/category-tree';
import type { Locale } from '@/i18n/config';
import { servicesDefaultDocument } from '@/lib/visual-editor/defaults';
import type { ReactNode } from 'react';

export function ServicesCanvas({ children, initialCategories, initialCategoryId }: { children: ReactNode; initialCategories?: SearchCategoryNode[]; initialCategoryId?: string }) {
  return <ServicesClient initialCategories={initialCategories ?? []} editorChildren={children} initialSelectedCategoryId={initialCategoryId} />;
}
const fieldLabels: Record<string,string> = { heroKicker: 'Eyebrow', heroTitle: 'Heading', heroSubtitle: 'Description', src: 'Watercolor artwork', searchServices: 'Search placeholder', searchButton: 'Search button', searchHint: 'Search hint', exploreTitle: 'Category heading', exploreSubtitle: 'Category description', categories: 'Category tree heading' };
export function servicesBlocks(locale: Locale): Record<string, ComponentConfig<any>> {
  const data = servicesDefaultDocument(locale);
  const defaults = [data.content[0], ...data.content[1].props.children];
  const result: Record<string, ComponentConfig<any>> = {};
  for (const item of defaults) {
    const name = item.type;
    if (result[name]) continue;
    result[name] = {
      label: ({ ServicesHero: 'Services hero', ServicesSearch: 'Live service search', ServicesCategories: 'Live category cards', ServicesTree: 'Live category tree', ServicesResults: 'Live provider results', MoroccanDivider: 'Moroccan divider' } as Record<string,string>)[name],
      fields: { content: { type: 'object', label: 'Content', objectFields: Object.fromEntries(Object.keys(item.props.content).map(key => [key, key === 'src' ? { ...imageField, label: fieldLabels[key] } : { type: 'text', label: fieldLabels[key] }])) }, styleFields },
      defaultProps: { content: item.props.content, styleFields: {} },
      render: ({ id, content, styleFields: styles, puck }) => <div data-visual-block={id} style={{ ...blockStyle(styles), ...(Object.keys(styles ?? {}).length ? {} : { display: puck?.isEditing ? 'block' : 'contents' }) }}>
        <VisualTypography id={id} value={styles} />
        {name === 'MoroccanDivider' ? <MoroccanDivider /> : <LivePageSection name={name} content={content} editing={Boolean(puck?.isEditing)} />}
      </div>,
    };
  }
  result.ServicesContent = { label: 'Services content area', fields: { styleFields, children: { type: 'slot' } }, defaultProps: { styleFields: {}, children: [] }, render: ({ id, styleFields: styles, children: Children }) => <Children className="mx-auto max-w-[1200px] px-5 sm:px-8" style={blockStyle(styles)} data-visual-block={id} /> };
  return result;
}
