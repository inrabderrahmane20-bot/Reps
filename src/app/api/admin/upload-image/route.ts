import { secureRoute } from '@/lib/security/route';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin-api';
import { isDatabaseConfigured, saveUploadedImage } from '@/lib/db';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { sanitizeUpload } from '@/lib/security/image';
import { storePublicImage } from '@/lib/security/media';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'categories');

async function handlePOST(req: NextRequest) {
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
    const sanitized = await sanitizeUpload(Buffer.from(bytes),file.type,MAX_FILE_SIZE);
    const buffer = sanitized.data;

    // Generate a unique filename: category-<timestamp>-<random>.<ext>
    const filename = `category-${randomUUID()}.${sanitized.extension}`;
    const publicUrl=await storePublicImage(filename,buffer,sanitized.mime);
    if(publicUrl)return NextResponse.json({url:publicUrl});

    // Vercel functions run on a read-only filesystem. When the application is
    // connected to Postgres, persist the bytes there and serve them through
    // /api/uploads/categories/[filename]. Local development without a database
    // keeps the filesystem fallback so `npm run dev` works out of the box.
    if (isDatabaseConfigured()) {
      await saveUploadedImage({ id: filename, mime: sanitized.mime, data: buffer });
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
    throw err;
  }
}

export const POST = secureRoute(handlePOST);
