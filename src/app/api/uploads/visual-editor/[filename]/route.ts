import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { readUploadedImage, isDatabaseConfigured } from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function GET(_req: Request, { params }: { params: { filename: string } }) {
  if (!/^visual-[a-f0-9-]{36}\.(png|jpg|gif|webp)$/.test(params.filename)) return new NextResponse(null, { status: 404 });
  try {
    let bytes: Buffer; let mime: string;
    if (isDatabaseConfigured()) {
      const media = await readUploadedImage(params.filename);
      if (!media) return new NextResponse(null, { status: 404 });
      bytes = media.data; mime = media.mime;
    } else {
      bytes = await fs.readFile(path.join(process.cwd(), 'public', 'uploads', 'visual-editor', params.filename));
      mime = ({ png: 'image/png', jpg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' } as Record<string, string>)[params.filename.split('.').pop()!];
    }
    return new NextResponse(new Uint8Array(bytes), { headers: { 'Content-Type': mime, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=31536000, immutable' } });
  } catch { return new NextResponse(null, { status: 404 }); }
}
