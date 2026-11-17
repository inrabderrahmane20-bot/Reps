import { secureRoute } from '@/lib/security/route';
﻿import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminSession } from '@/lib/admin-api';
import { EditorValidationError } from '@/lib/visual-editor/validation';
import { defaultDocument } from '@/lib/visual-editor/defaults';
import { isDocumentId, PAGE_DOCUMENTS } from '@/lib/visual-editor/types';
import { readDocument, saveDocument, RevisionConflict } from '@/lib/visual-editor/store';
import { locales, type Locale } from '@/i18n/config';

export const dynamic = 'force-dynamic';
function localeFrom(req: NextRequest): Locale | null {
  const locale = req.nextUrl.searchParams.get('locale') ?? 'en';
  return locales.includes(locale as Locale) ? locale as Locale : null;
}
async function handleGET(req: NextRequest, context: { params: Promise<{ documentId: string }> }) {
  const params = await context.params;
  const denied = await requireAdminSession(); if (denied) return denied;
  const locale = localeFrom(req);
  if (!locale || !isDocumentId(params.documentId)) return NextResponse.json({ error: 'Unknown document or locale.' }, { status: 404 });
  try { return NextResponse.json({ document: await readDocument(params.documentId, locale), defaults: defaultDocument(params.documentId, locale) }); }
  catch (error) { throw error; }
}
async function handlePUT(req: NextRequest, context: { params: Promise<{ documentId: string }> }) {
  const params = await context.params;
  const denied = await requireAdminSession(); if (denied) return denied;
  const locale = localeFrom(req);
  if (!locale || !isDocumentId(params.documentId)) return NextResponse.json({ error: 'Unknown document or locale.' }, { status: 404 });
  try {
    const text = await req.text();
    if (text.length > 520_000) return NextResponse.json({ error: 'Document exceeds the size limit.' }, { status: 413 });
    const body = JSON.parse(text);
    if (!['draft','publish','reset'].includes(body.action) || !Number.isSafeInteger(body.revision) || body.revision < 0) return NextResponse.json({ error: 'Invalid action or revision.' }, { status: 400 });
    const document = await saveDocument(params.documentId, locale, body.action, body.revision, body.data);
    const page = PAGE_DOCUMENTS.find(page => page.id === params.documentId);
    if (page) {
      // Literal URLs are invalidated without a page/layout suffix.
      revalidatePath(`/${locale}${page.path === '/' ? '' : page.path}/`);
    } else {
      revalidatePath('/[locale]', 'layout');
    }
    return NextResponse.json({ document, defaults: defaultDocument(params.documentId, locale) });
  } catch (error) {
    if (error instanceof RevisionConflict) return NextResponse.json({ error: error.message }, { status: 409 });
    if (error instanceof SyntaxError) return NextResponse.json({error:'Invalid JSON.'},{status:400});
    if (error instanceof EditorValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    throw error;
  }
}

export const GET = secureRoute(handleGET);
export const PUT = secureRoute(handlePUT);
