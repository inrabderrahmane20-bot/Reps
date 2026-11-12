'use client';
import type { ComponentConfig } from '@measured/puck';
import { ShieldCheck, FileText, BookOpen } from 'lucide-react';
import { ComingSoon } from '@/components/ui/coming-soon';
import { LEGAL_DEFAULTS } from '@/lib/visual-editor/defaults';
import { blockStyle, styleFields, VisualTypography } from './style-fields';
const icons = { ShieldCheck, FileText, BookOpen };
export function legalBlocks(id: string): Record<string,ComponentConfig<any>> {
  return {LegalIntro:{label:'Existing page introduction',fields:{content:{type:'object',label:'Content',objectFields:{title:{type:'text',label:'Heading'},description:{type:'textarea',label:'Description'},icon:{type:'select',options:Object.keys(icons).map(value=>({value,label:value}))}}},styleFields},defaultProps:{content:LEGAL_DEFAULTS[id],styleFields:{}},render:({id,content,styleFields:styles,puck})=><div data-visual-block={id} style={{...blockStyle(styles),...(Object.keys(styles??{}).length?{}:{display:puck?.isEditing?'block':'contents'})}}><VisualTypography id={id} value={styles}/><ComingSoon title={content.title} description={content.description} icon={icons[content.icon as keyof typeof icons]??ShieldCheck}/></div>}};
}
