import { HOME_SECTION_FIELDS, LEGAL_DEFAULTS } from './defaults';
import type { Data } from '@measured/puck';
import type { DocumentId } from './types';
import { safeUrl, sanitizeRichText, sanitizeStyles, safeCssValue } from './sanitize';
import { sanitizeCategoryAppearance } from '../category-appearance';

export class EditorValidationError extends Error {}

export const HOME_BLOCKS = [...Object.keys(HOME_SECTION_FIELDS), 'HomeContent'];
export const SERVICES_BLOCKS = ['ServicesHero','ServicesContent','ServicesSearch','ServicesCategories','ServicesTree','ServicesResults','MoroccanDivider'];
export const SHARED_BLOCKS = ['Section','Column','Grid','Text','RichText','Image','Icon','Button'] as const;
export function sanitizeDocument(input: unknown, documentId: DocumentId): Data {
  if ((JSON.stringify(input) ?? '').length > 500_000) throw new EditorValidationError('Document exceeds 500 KB.');
  let blocks = 0;
  const ids = new Set<string>();
  function visit(value: unknown, depth = 0, key = ''): any {
    if (depth > 30) throw new EditorValidationError('Document nesting is too deep.');
    if (typeof value === 'string') {
      if (value.length > 50_000) throw new EditorValidationError('A field is too long.');
      if (key === 'html') return sanitizeRichText(value);
      if (['href','src','brandImage'].includes(key)) return safeUrl(value, key !== 'href');
      if (/color|background/i.test(key)) return safeCssValue(value);
      return value;
    }
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'number') { if (!Number.isFinite(value)) throw new EditorValidationError('Invalid numeric field.'); return value; }
    if (Array.isArray(value)) return value.map(item => visit(item, depth + 1));
    if (!value || typeof value !== 'object') throw new EditorValidationError('Invalid document value.');
    const source = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    if ('type' in source) {
      const allowed = [...SHARED_BLOCKS, ...(LEGAL_DEFAULTS[documentId] ? ['LegalIntro'] : documentId === 'home' ? HOME_BLOCKS : documentId === 'services' ? SERVICES_BLOCKS : [documentId === 'navbar' ? 'Navbar' : 'Footer'])];
      if (typeof source.type !== 'string' || !allowed.includes(source.type as any)) throw new EditorValidationError('Unknown block type.');
      if (++blocks > 150) throw new EditorValidationError('A document can contain at most 150 blocks.');
      const id = (source.props as Record<string, unknown> | undefined)?.id;
      if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,120}$/.test(id) || ids.has(id)) throw new EditorValidationError('Block IDs must be unique and valid.');
      ids.add(id);
    }
    for (const [name, item] of Object.entries(source)) {
      if (['__proto__','constructor','prototype'].includes(name)) throw new EditorValidationError('Invalid property.');
      result[name] = name === 'styleFields' ? sanitizeStyles(item) : visit(item, depth + 1, name);
    }
    if ('type' in result) validateBlock(result);
    return result;
  }
  if (!input || typeof input !== 'object' || !Array.isArray((input as any).content)) throw new EditorValidationError('A Puck document is required.');
  const source = input as Record<string, unknown>;
  const result = visit({ content: source.content, root: source.root ?? { props: {} }, ...(source.zones ? { zones: source.zones } : {}) });
  for (const block of result.content) {
    if (!block || typeof block !== 'object' || typeof block.type !== 'string') throw new EditorValidationError('Invalid content block.');
  }
  if (result.root?.props?.categoryAppearance !== undefined) {
    if (!['home', 'services'].includes(documentId)) throw new EditorValidationError('Category appearance belongs to a page.');
    try { result.root.props.categoryAppearance = sanitizeCategoryAppearance(result.root.props.categoryAppearance); }
    catch (error) { throw new EditorValidationError(error instanceof Error ? error.message : 'Invalid category appearance.'); }
  }
  return result as Data;
}
function validateBlock(block: Record<string, any>) {
  const props = block.props;
  if (!props || typeof props !== 'object' || Array.isArray(props)) throw new EditorValidationError('Invalid block properties.');
  function strings(object: any, keys: string[]) {
    if (!object || typeof object !== 'object' || Array.isArray(object) || keys.some(key => typeof object[key] !== 'string')) throw new EditorValidationError('Invalid block text fields.');
  }
  function links(value: any) {
    if (!Array.isArray(value) || value.length > 40) throw new EditorValidationError('Invalid navigation link fields.');
    for (const link of value) {
      strings(link, ['label', 'href']);
      if (link.hot !== undefined && typeof link.hot !== 'boolean' || link.opensSearch !== undefined && typeof link.opensSearch !== 'boolean' || link.hiddenOnDesktop !== undefined && typeof link.hiddenOnDesktop !== 'boolean') throw new EditorValidationError('Invalid link appearance fields.');
    }
  }
  if (block.type === 'Navbar') { strings(props.content, ['brandName','arabicName','brandImage']); links(props.content.links); links(props.content.mobileLinks); links(props.content.mobileMoreLinks); }
  if (block.type === 'Footer') {
    strings(props.content, ['brandName','arabicName','brandImage','tagline','footerNote','languageLabel','rights']);
    if (!Array.isArray(props.content.columns) || props.content.columns.length > 12) throw new EditorValidationError('Invalid footer column fields.');
    for (const column of props.content.columns) { strings(column, ['title']); links(column.links); }
  }
  if (['Section','Column','Grid','ServicesContent','HomeContent'].includes(block.type)) {
    if (!Array.isArray(props.children) || props.children.some((child: any) => !child || typeof child.type !== 'string')) throw new EditorValidationError('Invalid nested block fields.');
  }
  if (block.type === 'LegalIntro') strings(props.content, ['title','description','icon']);
  if (HOME_SECTION_FIELDS[block.type]) strings(props.content, [...HOME_SECTION_FIELDS[block.type], ...(block.type === 'HomeHero' ? ['src'] : [])]);
  const required: Record<string,string[]> = { ServicesHero: ['heroKicker','heroTitle','heroSubtitle','src'], ServicesSearch: ['searchServices','searchButton','searchHint'], ServicesCategories: ['exploreTitle','exploreSubtitle'], ServicesTree: ['categories'], ServicesResults: [], MoroccanDivider: [] };
  if (required[block.type]) strings(props.content, required[block.type]);
  if (block.type === 'Text') strings(props, ['text','as']);
  if (block.type === 'RichText') strings(props, ['html']);
  if (block.type === 'Image') strings(props, ['src','alt','objectFit']);
  if (block.type === 'Icon') strings(props, ['name','color']);
  if (block.type === 'Button') strings(props, ['label','href','textColor','backgroundColor','hoverColor','hoverBackground']);
}
export function validateImage(bytes: Buffer, mime: string): string {
  if (!bytes.length || bytes.length > 4 * 1024 * 1024) throw new EditorValidationError('Images must be between 1 byte and 4 MB.');
  const valid: Record<string, boolean> = {
    'image/png': bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
    'image/jpeg': bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255,
    'image/gif': ['GIF87a','GIF89a'].includes(bytes.subarray(0,6).toString()),
    'image/webp': bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP',
  };
  if (!valid[mime]) throw new EditorValidationError('Upload a valid JPEG, PNG, GIF, or WebP image.');
  return ({'image/png':'png','image/jpeg':'jpg','image/gif':'gif','image/webp':'webp'} as Record<string,string>)[mime];
}
