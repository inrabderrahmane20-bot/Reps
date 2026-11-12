import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { requireAdminSession } from '@/lib/admin-api';
import { isDatabaseConfigured, saveUploadedImage } from '@/lib/db';
import { validateImage } from '@/lib/visual-editor/validation';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  const denied = await requireAdminSession(); if (denied) return denied;
  if (req.headers.get('origin') && req.headers.get('origin') !== req.nextUrl.origin) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  if (Number(req.headers.get('content-length')) > 4 * 1024 * 1024 + 65536) return NextResponse.json({ error: 'Image exceeds 4 MB.' }, { status: 413 });
  try {
    const form = await req.formData(); const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Choose an image.' }, { status: 400 });
    if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: 'Image exceeds 4 MB.' }, { status: 413 });
    const bytes = Buffer.from(await file.arrayBuffer());
    let extension: string;
    try { extension = validateImage(bytes, file.type); } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }); }
    const filename = `visual-${randomUUID()}.${extension}`;
    if (isDatabaseConfigured()) await saveUploadedImage({ id: filename, mime: file.type, data: bytes });
    else {
      if (process.env.VERCEL) return NextResponse.json({ error: 'Configure database storage before uploading images.' }, { status: 503 });
      const directory = path.join(process.cwd(), 'public', 'uploads', 'visual-editor');
      await fs.mkdir(directory, { recursive: true }); await fs.writeFile(path.join(directory, filename), bytes);
    }
    return NextResponse.json({ url: `/api/uploads/visual-editor/${filename}` });
  } catch (error) { console.error('Visual editor image upload failed', error); return NextResponse.json({ error: 'Image upload failed.' }, { status: 500 }); }
}
