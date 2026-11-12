import { NextRequest,NextResponse } from 'next/server';
import { getCategoryTree } from '@/lib/category-store';
import { readCategorySearchCounts,incrementCategorySearchCount } from '@/lib/db';
import { flattenServiceCategories,serviceRoots } from '@/lib/services-browser';
export const dynamic='force-dynamic';
const buckets=new Map<string,{count:number;expires:number}>();
async function counts() {
  const allowed=new Set(flattenServiceCategories(serviceRoots(await getCategoryTree())).map(node=>node.id));
  return Object.fromEntries(Object.entries(await readCategorySearchCounts()).filter(([id])=>allowed.has(id)));
}
export async function GET() {
  try {return NextResponse.json({counts:await counts()},{headers:{'Cache-Control':'no-store'}});}
  catch {return NextResponse.json({counts:{}},{status:503});}
}
export async function POST(request:NextRequest) {
  if(request.headers.get('origin') && request.headers.get('origin')!==request.nextUrl.origin) return NextResponse.json({error:'Invalid origin'},{status:403});
  const now=Date.now();
  for(const [key,bucket] of buckets) if(bucket.expires<now) buckets.delete(key);
  const key=(request.headers.get('x-forwarded-for')??'local').split(',')[0].trim();
  const bucket=buckets.get(key)??{count:0,expires:now+60000};
  if(bucket.count>=12 || buckets.size>5000) return NextResponse.json({error:'Try again later'},{status:429});
  bucket.count++;buckets.set(key,bucket);
  try {
    const body=await request.text();if(body.length>1024) return NextResponse.json({error:'Invalid event'},{status:413});
    const {categoryId}=JSON.parse(body);
    if(typeof categoryId!=='string' || !flattenServiceCategories(serviceRoots(await getCategoryTree())).some(node=>node.id===categoryId)) return NextResponse.json({error:'Unknown service category'},{status:400});
    await incrementCategorySearchCount(categoryId);
    return NextResponse.json({counts:await counts()});
  } catch {return NextResponse.json({error:'Search statistics unavailable'},{status:400});}
}
