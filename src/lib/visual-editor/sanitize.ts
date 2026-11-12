import sanitizeHtml from 'sanitize-html';
import type { StyleValues } from './types';

export const STYLE_KEYS = ['fontFamily','fontSize','fontWeight','color','background','backgroundColor','border','borderRadius','padding','margin','width','height','textAlign','boxShadow'] as const;
const CSS_PROPERTIES: Record<string, keyof StyleValues> = {
  'font-family':'fontFamily','font-size':'fontSize','font-weight':'fontWeight',color:'color',background:'background','background-color':'backgroundColor',border:'border','border-radius':'borderRadius',padding:'padding',margin:'margin',width:'width',height:'height','text-align':'textAlign','box-shadow':'boxShadow',
};
export function safeCssValue(value: unknown): string {
  if (typeof value !== 'string' || value.length > 250) return '';
  const trimmed = value.trim();
  // Values only: no selectors, external resources, escapes, unknown variables, or CSS execution.
  const checked = trimmed.replace(/var\(--font-(?:sans|display|arabic|home-display|home-sans)\)/g, 'font');
  if (/[{};<>\\@\u0000-\u001f]/.test(checked) || /url\s*\(|expression\s*\(|javascript|behavior|var\s*\(|!important|\/\*/i.test(checked)) return '';
  return trimmed;
}
export function sanitizeStyles(value: unknown): StyleValues {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const clean: StyleValues = {};
  for (const key of STYLE_KEYS) { const next = safeCssValue(source[key]); if (next) clean[key] = next; }
  if (typeof source.customCss === 'string') {
    const declarations: string[] = [];
    for (const declaration of source.customCss.slice(0, 4000).split(';')) {
      const separator = declaration.indexOf(':');
      if (separator < 0) continue;
      const property = declaration.slice(0, separator).trim().toLowerCase();
      const next = safeCssValue(declaration.slice(separator + 1));
      if (CSS_PROPERTIES[property] && next) declarations.push(`${property}: ${next}`);
    }
    if (declarations.length) clean.customCss = declarations.join('; ');
  }
  return clean;
}
export function styleObject(value?: StyleValues): Record<string, string> {
  const clean = sanitizeStyles(value);
  const { customCss, ...rest } = clean;
  const result = rest as Record<string, string>;
  for (const declaration of customCss?.split(';') ?? []) {
    const separator = declaration.indexOf(':');
    const key = CSS_PROPERTIES[declaration.slice(0, separator).trim()];
    if (key) result[key] = declaration.slice(separator + 1).trim();
  }
  return result;
}
export function safeUrl(value: unknown, image = false): string {
  if (typeof value !== 'string') return '';
  const url = value.trim();
  if (!url || url.length > 2048 || /[\u0000-\u0020\\<>"']/.test(url)) return '';
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  if (!image && /^#[\w-]+$/.test(url)) return url;
  try { const parsed = new URL(url); if (['https:', 'http:', ...(!image ? ['mailto:', 'tel:'] : [])].includes(parsed.protocol)) return url; } catch { /* Invalid URL. */ }
  return '';
}
export function sanitizeRichText(value: string): string {
  return sanitizeHtml(value, { allowedTags: ['p','br','strong','em','u','s','ul','ol','li','h2','h3','h4','blockquote','a'], allowedAttributes: { a: ['href','title'] }, allowedSchemes: ['https','http','mailto','tel'], allowProtocolRelative: false, transformTags: { a: (_tag, attributes) => ({ tagName: 'a', attribs: { ...attributes, href: safeUrl(attributes.href) } }) } });
}
