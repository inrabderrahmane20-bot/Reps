import { notFound, redirect } from 'next/navigation';
import { siteFontClassName } from '@/lib/site-fonts';
import { requireAdminSession } from '@/lib/admin-api';
import { readDocument } from '@/lib/visual-editor/store';
import { defaultDocument } from '@/lib/visual-editor/defaults';
import { isDocumentId } from '@/lib/visual-editor/types';
import { locales, type Locale } from '@/i18n/config';
import VisualEditorClient from '../visual-editor-client';

export const dynamic = 'force-dynamic';
export default async function VisualDocumentPage({ params, searchParams }: { params: { documentId: string }; searchParams: { locale?: string } }) {
  if (await requireAdminSession()) redirect('/admin');
  if (!isDocumentId(params.documentId)) notFound();
  const locale = (searchParams.locale ?? 'en') as Locale;
  if (!locales.includes(locale)) notFound();
  return <VisualEditorClient id={params.documentId} locale={locale} initial={await readDocument(params.documentId, locale)} defaults={defaultDocument(params.documentId, locale)} fontClass={siteFontClassName} />;
}
