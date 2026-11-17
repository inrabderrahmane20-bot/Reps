import { secureRoute } from '@/lib/security/route';
import { NextResponse } from 'next/server';
import { getCategoryTree } from '@/lib/category-store';

export const dynamic = 'force-dynamic';

async function handleGET() {
  return NextResponse.json({ categories: await getCategoryTree() });
}

export const GET = secureRoute(handleGET);
