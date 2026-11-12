import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin-api';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
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

    // Ensure upload directory exists.
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate a unique filename: category-<timestamp>-<random>.<ext>
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const filename = `category-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    fs.writeFileSync(filePath, buffer);

    const url = `/uploads/categories/${filename}`;
    return NextResponse.json({ url }, { status: 200 });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: err.message || 'Image upload failed.' },
      { status: 500 }
    );
  }
}