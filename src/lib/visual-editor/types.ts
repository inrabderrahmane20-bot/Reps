import type { Data } from '@measured/puck';
import type { Locale } from '@/i18n/config';

export type DocumentId = 'navbar' | 'footer';
export interface VisualDocument {
  id: DocumentId;
  locale: Locale;
  revision: number;
  draft: Data | null;
  published: Data | null;
  updatedAt: string;
  publishedAt: string | null;
}
export type EditorAction = 'draft' | 'publish' | 'reset';
export type StyleValues = Partial<Record<'fontFamily' | 'fontSize' | 'fontWeight' | 'color' | 'background' | 'backgroundColor' | 'border' | 'borderRadius' | 'padding' | 'margin' | 'width' | 'height' | 'textAlign' | 'boxShadow' | 'customCss', string>>;
export interface EditableLink { label: string; href: string; hot?: boolean; opensSearch?: boolean; hiddenOnDesktop?: boolean }
export interface NavbarContent {
  brandName: string;
  arabicName: string;
  brandImage: string;
  links: EditableLink[];
  mobileLinks: EditableLink[];
  mobileMoreLinks: EditableLink[];
}
export interface FooterContent {
  brandName: string;
  arabicName: string;
  brandImage: string;
  tagline: string;
  footerNote: string;
  languageLabel: string;
  rights: string;
  columns: { title: string; links: EditableLink[] }[];
}
export const DOCUMENTS = [{ id: 'navbar', label: 'Navbar / Header' }, { id: 'footer', label: 'Footer' }] as const;
export function isDocumentId(value: string): value is DocumentId { return value === 'navbar' || value === 'footer'; }
