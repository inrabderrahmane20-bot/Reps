import { createElement } from 'react';
import type { CSSProperties } from 'react';
import type { ObjectField } from '@measured/puck';
import { styleObject, safeCssValue } from '@/lib/visual-editor/sanitize';
import type { StyleValues } from '@/lib/visual-editor/types';

export const styleFields: ObjectField = { type: 'object', label: 'Style', objectFields: {
  fontFamily: { type: 'select', label: 'Font family', options: [ { label: 'Current / inherited', value: '' }, { label: 'Manrope', value: 'var(--font-sans), sans-serif' }, { label: 'Playfair Display', value: 'var(--font-display), serif' }, { label: 'Cairo', value: 'var(--font-arabic), sans-serif' }, { label: 'Georgia', value: 'Georgia, serif' }, { label: 'Arial', value: 'Arial, sans-serif' } ] },
  fontSize: { type: 'text', label: 'Font size (e.g. 16px)' }, fontWeight: { type: 'text', label: 'Font weight' },
  color: { type: 'text', label: 'Text color' }, backgroundColor: { type: 'text', label: 'Background color' },
  background: { type: 'text', label: 'Background (color or gradient)' },
  border: { type: 'text', label: 'Border (e.g. 1px solid #ddd)' }, borderRadius: { type: 'text', label: 'Border radius' },
  padding: { type: 'text', label: 'Padding' }, margin: { type: 'text', label: 'Margin' },
  width: { type: 'text', label: 'Width' }, height: { type: 'text', label: 'Height' },
  textAlign: { type: 'select', label: 'Alignment', options: [ { label: 'Current', value: '' }, { label: 'Start', value: 'start' }, { label: 'Center', value: 'center' }, { label: 'End', value: 'end' } ] },
  boxShadow: { type: 'text', label: 'Shadow' },
  customCss: { type: 'textarea', label: 'Additional safe CSS declarations (no selectors)' },
} };
export function blockStyle(value?: StyleValues): CSSProperties { return styleObject(value) as CSSProperties; }
export function VisualTypography({ id, value }: { id: string; value?: StyleValues }) {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) return null;
  const resolved = styleObject(value);
  const declarations = ['fontFamily','fontSize','fontWeight','color'].flatMap(key => {
    const next = safeCssValue(resolved[key]);
    return next ? [`${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}:${next}`] : [];
  }).join(';');
  return declarations ? createElement('style', null, `[data-visual-block="${id}"] :is(a,button,p,h1,h2,h3,h4,h5,h6,span){${declarations}}`) : null;
}
