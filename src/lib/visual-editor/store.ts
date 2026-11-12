import type { Data } from '@measured/puck';
import type { Locale } from '@/i18n/config';
import { readVisualEditorRecord, mutateVisualEditorRecord } from '@/lib/db';
import type { DocumentId, EditorAction, VisualDocument } from './types';
import { sanitizeDocument } from './validation';

export class RevisionConflict extends Error {}
export function emptyDocument(id: DocumentId, locale: Locale): VisualDocument {
  return { id, locale, revision: 0, draft: null, published: null, updatedAt: '', publishedAt: null };
}
export async function readDocument(id: DocumentId, locale: Locale): Promise<VisualDocument> {
  return await readVisualEditorRecord<VisualDocument>(`${id}-${locale}`) ?? emptyDocument(id, locale);
}
export function updateDocument(current: VisualDocument, action: EditorAction, revision: number, data?: unknown): VisualDocument {
  if (current.revision !== revision) throw new RevisionConflict('This document changed in another editor. Reload before saving.');
  const now = new Date().toISOString();
  const clean = action === 'reset' ? null : sanitizeDocument(data, current.id);
  return { ...current, revision: current.revision + 1, updatedAt: now,
    draft: action === 'reset' ? null : clean,
    published: action === 'reset' ? null : action === 'publish' ? clean : current.published,
    publishedAt: action === 'reset' ? null : action === 'publish' ? now : current.publishedAt,
  };
}
export async function saveDocument(id: DocumentId, locale: Locale, action: EditorAction, revision: number, data?: Data): Promise<VisualDocument> {
  return mutateVisualEditorRecord<VisualDocument>(`${id}-${locale}`, current => updateDocument(current ?? emptyDocument(id, locale), action, revision, data));
}
