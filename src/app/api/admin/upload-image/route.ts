import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin-api';
import { isDatabaseConfigured, saveUploadedImage } from '@/lib/db';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'categories');

export async function POST(req: NextRequest) {
  // Verify the current session is an admin.
  const denied = await requireAdminSession();
  if (denied) return denied;

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, WebP and GIF images are allowed.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Image must be smaller than 2 MB.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate a unique filename: category-<timestamp>-<random>.<ext>
    const ext =
      EXTENSION_BY_TYPE[file.type] ??
      file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') ??
      'jpg';
    const filename = `category-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Vercel functions run on a read-only filesystem. When the application is
    // connected to Postgres, persist the bytes there and serve them through
    // /api/uploads/categories/[filename]. Local development without a database
    // keeps the filesystem fallback so `npm run dev` works out of the box.
    if (isDatabaseConfigured()) {
      await saveUploadedImage({ id: filename, mime: file.type, data: buffer });
      return NextResponse.json({ url: `/api/uploads/categories/${filename}` }, { status: 200 });
    }

    if (process.env.VERCEL) {
      return NextResponse.json(
        { error: 'Image storage is not configured. Connect the application database.' },
        { status: 500 }
      );
    }

    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);
    return NextResponse.json({ url: `/api/uploads/categories/${filename}` }, { status: 200 });
  } catch (err) {
    console.error('Upload error:', err);
    const message = err instanceof Error ? err.message : 'Image upload failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
