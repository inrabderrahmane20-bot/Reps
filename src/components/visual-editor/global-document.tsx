import type { SearchCategoryNode } from '@/lib/category-tree';
import type { ReactNode } from 'react';
import type { Locale } from '@/i18n/config';
import type { DocumentId } from '@/lib/visual-editor/types';
import { readDocument } from '@/lib/visual-editor/store';
import { PublishedVisualDocument } from './config';

export async function GlobalDocument({ id, locale, children, initialCategories }: { id: DocumentId; locale: Locale; children: ReactNode; initialCategories?: SearchCategoryNode[] }) {
  try {
    const document = await readDocument(id, locale);
    if (document.published) return <PublishedVisualDocument id={id} locale={locale} data={document.published} initialCategories={initialCategories} />;
  } catch (error) {
    console.error('Published visual document could not be loaded; using the existing component.', error);
  }
  return <>{children}</>;
}
