import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin-api';
import { DOCUMENTS } from '@/lib/visual-editor/types';
import { readDocument } from '@/lib/visual-editor/store';
import { locales, type Locale } from '@/i18n/config';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  const denied = await requireAdminSession(); if (denied) return denied;
  const locale = (req.nextUrl.searchParams.get('locale') ?? 'en') as Locale;
  if (!locales.includes(locale)) return NextResponse.json({ error: 'Unknown locale.' }, { status: 400 });
  try {
    const documents = await Promise.all(DOCUMENTS.map(async entry => ({ ...entry, ...await readDocument(entry.id, locale) })));
    return NextResponse.json({ documents });
  } catch { return NextResponse.json({ error: 'Documents could not be loaded.' }, { status: 500 }); }
}
