import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Locale } from '@/i18n/config';
import { getCategoryTree } from '@/lib/category-store';
import { resolveServiceCategory,serviceRoots } from '@/lib/services-browser';
import { GlobalDocument } from '@/components/visual-editor/global-document';
import { ServicesStructuredData,ServicesLocalGuide,servicesMetadata } from '@/components/services/services-seo';
import ServicesClient from '../../services-client';
export const dynamic='force-dynamic';
type Props={params:{locale:Locale;slug:string[]};searchParams:Record<string,string|undefined>};
export async function generateMetadata({params,searchParams}:Props):Promise<Metadata> {
  const roots=serviceRoots(await getCategoryTree());
  const path=resolveServiceCategory(roots,params.slug);
  if(!path) notFound();
  return servicesMetadata(params.locale,roots,path,Object.keys(searchParams).some(key=>['q','sort','zone','availability','minRating','offset'].includes(key)));
}
export default async function ServiceCategoryPage({params}:Props) {
  const categories=await getCategoryTree();
  const roots=serviceRoots(categories);
  const path=resolveServiceCategory(roots,params.slug);
  if(!path) notFound();
  const id=path[path.length-1].id;
  return <><ServicesStructuredData locale={params.locale} roots={roots} path={path}/><GlobalDocument id="services" locale={params.locale} initialCategories={categories} initialCategoryId={id}><ServicesClient initialCategories={categories} initialSelectedCategoryId={id}/></GlobalDocument><ServicesLocalGuide locale={params.locale} roots={roots} path={path}/></>;
}
