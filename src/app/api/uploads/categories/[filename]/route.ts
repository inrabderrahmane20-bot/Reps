import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { isDatabaseConfigured, readUploadedImage } from '@/lib/db';

export const dynamic = 'force-dynamic';

const SAFE_FILENAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

/**
 * Serves admin-uploaded category photos that live in Postgres on serverless
 * deployments (the filesystem is read-only on Vercel). Local development
 * uploads are written to `public/uploads/categories`, which Next.js serves
 * directly, but we also fall back to disk here so both paths keep working.
 */
export async function GET(
  _req: Request,
  { params }: { params: { filename: string } }
) {
  const filename = params.filename;
  if (!filename || !SAFE_FILENAME.test(filename)) {
    return NextResponse.json({ error: 'Invalid filename.' }, { status: 400 });
  }

  try {
    if (isDatabaseConfigured()) {
      const media = await readUploadedImage(filename);
      if (media) {
        return new NextResponse(new Uint8Array(media.data), {
          status: 200,
          headers: {
            'Content-Type': media.mime || 'application/octet-stream',
            'Content-Length': String(media.data.byteLength),
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
    }

    // Local filesystem fallback (development).
    const extension = filename.split('.').pop()?.toLowerCase() ?? '';
    const mime = MIME_BY_EXTENSION[extension];
    if (!mime) {
      return NextResponse.json({ error: 'Image not found.' }, { status: 404 });
    }

    const filePath = path.join(process.cwd(), 'public', 'uploads', 'categories', filename);
    const resolved = path.resolve(filePath);
    const uploadRoot = path.resolve(process.cwd(), 'public', 'uploads', 'categories');
    if (!resolved.startsWith(uploadRoot + path.sep)) {
      return NextResponse.json({ error: 'Invalid filename.' }, { status: 400 });
    }

    const data = await fs.readFile(resolved);
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Length': String(data.byteLength),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === 'ENOENT') {
      return NextResponse.json({ error: 'Image not found.' }, { status: 404 });
    }
    console.error('Serving uploaded image failed:', error);
    return NextResponse.json({ error: 'Unable to load image.' }, { status: 500 });
  }
}
