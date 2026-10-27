import { NextResponse } from 'next/server';
import { SEARCH_CATEGORIES } from '@/lib/category-tree';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ categories: SEARCH_CATEGORIES });
}
