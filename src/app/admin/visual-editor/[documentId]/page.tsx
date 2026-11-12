import { notFound, redirect } from 'next/navigation';
import { Cairo, DM_Sans, Familjen_Grotesk, Manrope, Playfair_Display } from 'next/font/google';
import { requireAdminSession } from '@/lib/admin-api';
import { readDocument } from '@/lib/visual-editor/store';
import { defaultDocument } from '@/lib/visual-editor/defaults';
import { isDocumentId } from '@/lib/visual-editor/types';
import { locales, type Locale } from '@/i18n/config';
import VisualEditorClient from '../visual-editor-client';

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-display', display: 'swap', weight: ['400','500','600','700'] });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-sans', display: 'swap', weight: ['400','500','600','700'] });
const cairo = Cairo({ subsets: ['arabic','latin'], variable: '--font-arabic', display: 'swap' });
const familjen = Familjen_Grotesk({ subsets: ['latin'], variable: '--font-home-display', display: 'swap', weight: ['500','600','700'] });
const dm = DM_Sans({ subsets: ['latin'], variable: '--font-home-sans', display: 'swap', weight: ['400','500','600'] });
export const dynamic = 'force-dynamic';
export default async function VisualDocumentPage({ params, searchParams }: { params: { documentId: string }; searchParams: { locale?: string } }) {
  if (await requireAdminSession()) redirect('/admin');
  if (!isDocumentId(params.documentId)) notFound();
  const locale = (searchParams.locale ?? 'en') as Locale;
  if (!locales.includes(locale)) notFound();
  return <VisualEditorClient id={params.documentId} locale={locale} initial={await readDocument(params.documentId, locale)} defaults={defaultDocument(params.documentId, locale)} fontClass={`${playfair.variable} ${manrope.variable} ${cairo.variable} ${familjen.variable} ${dm.variable}`} />;
}
