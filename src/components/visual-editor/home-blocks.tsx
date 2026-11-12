'use client';
import type { ComponentConfig } from '@measured/puck';
import HomeClient from '@/app/[locale]/home-client';
import { LivePageSection } from './page-context';
import { blockStyle, styleFields, VisualTypography } from './style-fields';
import { imageField } from './content-blocks';
import { homeDefaultDocument } from '@/lib/visual-editor/defaults';
import type { Locale } from '@/i18n/config';

export { HomeClient as HomeCanvas };
export function homeBlocks(locale: Locale): Record<string, ComponentConfig<any>> {
  const data = homeDefaultDocument(locale);
  const labels: Record<string,string> = { HomeHero: 'Home hero', HomeCategories: 'Live category grid', HomeBestRated: 'Best rated providers', HomeCommunities: 'Live communities', HomePromotions: 'Live promotions', HomeAvailable: 'Available providers', HomeSponsored: 'Sponsored providers' };
  const blocks: Record<string, ComponentConfig<any>> = {};
  for (const item of [data.content[0], ...data.content[1].props.children]) {
    blocks[item.type] = {
      label: labels[item.type],
      fields: { content: { type: 'object', label: 'Content', objectFields: Object.fromEntries(Object.keys(item.props.content).map(key => [key, key === 'src' ? { ...imageField, label: 'Hero photograph' } : {type: 'text', label: key.replace(/([A-Z])/g,' $1').replace(/^section /,'')}])) }, styleFields },
      defaultProps: { content: item.props.content, styleFields: {} },
      render: ({ id, content, styleFields: styles, puck }) => <div data-visual-block={id} style={{ ...blockStyle(styles), ...(Object.keys(styles ?? {}).length ? {} : { display: puck?.isEditing ? 'block' : 'contents' }) }}>
        <VisualTypography id={id} value={styles} />
        {puck?.isEditing && <div style={{font:'12px system-ui',padding:'6px',color:'#315348',background:'#eef4f1'}}>{labels[item.type]} — live data; empty lists stay hidden on the public page.</div>}
        <LivePageSection name={item.type} content={content} editing={Boolean(puck?.isEditing)} />
      </div>,
    };
  }
  blocks.HomeContent = { label: 'Home content area', fields: { styleFields, children: {type:'slot'} }, defaultProps:{styleFields:{},children:[]}, render:({id, styleFields:styles, children:Children}) => <Children className="home-primary-sections" style={blockStyle(styles)} data-visual-block={id} /> };
  return blocks;
}
