import { NextResponse } from 'next/server';
import { getCategoryTree } from '@/lib/category-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ categories: await getCategoryTree() });
}
