import { secureRoute } from '@/lib/security/route';
﻿import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { requireAdminSession } from '@/lib/admin-api';
import { isDatabaseConfigured, saveUploadedImage } from '@/lib/db';
import { sanitizeUpload } from '@/lib/security/image';
import { storePublicImage } from '@/lib/security/media';
export const dynamic = 'force-dynamic';
async function handlePOST(req: NextRequest) {
  const denied = await requireAdminSession(); if (denied) return denied;
  if (Number(req.headers.get('content-length')) > 4 * 1024 * 1024 + 65536) return NextResponse.json({ error: 'Image exceeds 4 MB.' }, { status: 413 });
  try {
    const form = await req.formData(); const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Choose an image.' }, { status: 400 });
    if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: 'Image exceeds 4 MB.' }, { status: 413 });
    const clean=await sanitizeUpload(Buffer.from(await file.arrayBuffer()),file.type);
    const bytes=clean.data,extension=clean.extension;
    const filename = `visual-${randomUUID()}.${extension}`;
    const publicUrl=await storePublicImage(filename,bytes,clean.mime);
    if(publicUrl)return NextResponse.json({url:publicUrl});
    if (isDatabaseConfigured()) await saveUploadedImage({ id: filename, mime: clean.mime, data: bytes });
    else {
      if (process.env.VERCEL) return NextResponse.json({ error: 'Configure database storage before uploading images.' }, { status: 503 });
      const directory = path.join(process.cwd(), 'public', 'uploads', 'visual-editor');
      await fs.mkdir(directory, { recursive: true }); await fs.writeFile(path.join(directory, filename), bytes);
    }
    return NextResponse.json({ url: `/api/uploads/visual-editor/${filename}` });
  } catch (error) { throw error; }
}

export const POST = secureRoute(handlePOST);
