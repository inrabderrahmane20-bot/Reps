import type { Metadata } from 'next';
import type { Locale } from '@/i18n/config';
import { GlobalDocument } from '@/components/visual-editor/global-document';
import { ServicesStructuredData,ServicesLocalGuide,servicesMetadata } from '@/components/services/services-seo';
import { serviceRoots } from '@/lib/services-browser';
import { getCategoryTree } from '@/lib/category-store';
import ServicesClient from './services-client';
export const dynamic='force-dynamic';
export async function generateMetadata({params,searchParams}:{params:{locale:Locale};searchParams:Record<string,string|undefined>}):Promise<Metadata> {
  const roots=serviceRoots(await getCategoryTree());
  const filtered=['q','cat','catId','sort','zone','availability','minRating','offset'].some(key=>Boolean(searchParams[key]));
  return servicesMetadata(params.locale,roots,[],filtered);
}
export default async function ServicesPage({params}:{params:{locale:Locale}}) {
  const categories=await getCategoryTree();
  const roots=serviceRoots(categories);
  return <><ServicesStructuredData locale={params.locale} roots={roots}/><GlobalDocument id="services" locale={params.locale} initialCategories={categories}><ServicesClient initialCategories={categories}/></GlobalDocument><ServicesLocalGuide locale={params.locale} roots={roots}/></>;
}
