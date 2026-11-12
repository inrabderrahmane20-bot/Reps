'use client';

import type { ComponentConfig } from '@measured/puck';
import type { CSSProperties } from 'react';
import type { Locale } from '@/i18n/config';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { navbarDefaults, footerDefaults } from '@/lib/visual-editor/defaults';
import { blockStyle, styleFields, VisualTypography } from './style-fields';
import { imageField } from './content-blocks';

const linkFields = { label: { type: 'text' as const }, href: { type: 'text' as const, label: 'Link' } };
export function globalBlocks(locale: Locale, previewPath?: string): Record<string, ComponentConfig<any>> {
  return {
    Navbar: { label: 'Existing Navbar / Header', fields: { content: { type: 'object', label: 'Navbar content', objectFields: {
      brandName: { type: 'text', label: 'Brand name' }, arabicName: { type: 'text', label: 'Arabic brand name' }, brandImage: { ...imageField, label: 'Logo image' },
      links: { type: 'array', label: 'Navigation links', arrayFields: { ...linkFields,
        hot: { type: 'radio', label: 'Promotion appearance', options: [{ label: 'No', value: false }, { label: 'Yes', value: true }] },
        hiddenOnDesktop: { type: 'radio', label: 'Hide on desktop', options: [{ label: 'No', value: false }, { label: 'Yes', value: true }] },
        opensSearch: { type: 'radio', label: 'Open category search instead of navigating', options: [{ label: 'No', value: false }, { label: 'Yes', value: true }] },
      }, defaultItemProps: { label: 'Link', href: '/', hot: false, opensSearch: false, hiddenOnDesktop: false }, getItemSummary: item => item.label },
      mobileLinks: { type: 'array', label: 'Mobile primary links', arrayFields: linkFields, defaultItemProps: { label: 'Link', href: '/' }, getItemSummary: item => item.label },
      mobileMoreLinks: { type: 'array', label: 'Mobile additional links', arrayFields: linkFields, defaultItemProps: { label: 'Link', href: '/' }, getItemSummary: item => item.label },
    } }, styleFields }, defaultProps: { content: navbarDefaults(locale), styleFields: {} },
    render: ({ id, content, styleFields }) => <><VisualTypography id={id} value={styleFields} /><Navbar content={content} style={blockStyle(styleFields) as CSSProperties} visualId={id} previewPath={previewPath} /></>,
    },
    Footer: { label: 'Existing Footer', fields: { content: { type: 'object', label: 'Footer content', objectFields: {
      brandName: { type: 'text', label: 'Brand name' }, arabicName: { type: 'text', label: 'Arabic brand name' }, brandImage: { ...imageField, label: 'Logo image' },
      tagline: { type: 'textarea' }, footerNote: { type: 'text' }, languageLabel: { type: 'text' }, rights: { type: 'text' },
      columns: { type: 'array', arrayFields: { title: { type: 'text' }, links: { type: 'array', arrayFields: linkFields, defaultItemProps: { label: 'Link', href: '/' }, getItemSummary: item => item.label } }, defaultItemProps: { title: 'Links', links: [] }, getItemSummary: item => item.title },
    } }, styleFields }, defaultProps: { content: footerDefaults(locale), styleFields: {} },
    render: ({ id, content, styleFields }) => <><VisualTypography id={id} value={styleFields} /><Footer content={content} style={blockStyle(styleFields)} visualId={id} previewPath={previewPath} /></>,
    },
  };
}
