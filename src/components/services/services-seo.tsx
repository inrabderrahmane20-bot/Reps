import type { Locale } from '@/i18n/config';
import type { SearchCategoryNode } from '@/lib/category-tree';
import { getCategoryLabel } from '@/lib/category-tree';
import { buildMetadata, localizedUrl, SITE_URL } from '@/lib/seo';
import { servicesCopy } from '@/lib/services-copy';
import { serviceCategoryHref } from '@/lib/services-browser';
import { categoryBranchValues } from '@/lib/service-selection';
import { normalizeCategory } from '@/lib/service-categories';
import { readDb } from '@/lib/db';

export async function hasPublicProviders(node: SearchCategoryNode): Promise<boolean> {
  const values=categoryBranchValues(node);
  const db=await readDb();
  return db.users.some(user=>user.status==='active' && user.providerStatus==='approved' && user.provider && values.has(normalizeCategory(user.provider.category)));
}
export async function servicesMetadata(locale:Locale, roots:SearchCategoryNode[], path:SearchCategoryNode[] = [], filtered=false) {
  const copy=servicesCopy(locale);
  const node=path.at(-1);
  const label=node?getCategoryLabel(node,locale):'';
  const route=node?serviceCategoryHref(roots,node.id):'/services';
  const title=node?`${label} ${copy.categoryPage}`:copy.directory;
  const description=node?`${label} ${copy.categoryPage}. ${copy.categoryDescription}`:copy.description;
  const index=!filtered && (!node || Boolean(node.children?.length) || await hasPublicProviders(node));
  const metadata = await buildMetadata({locale,path:route,title,description,image:`${SITE_URL}/images/services/marrakech-hero-panoramic.jpg`,robots:{index,follow:true},includeSiteName:false});
  return {...metadata,title:`${title} | Annabid`,openGraph:{...metadata.openGraph,title:`${title} | Annabid`,siteName:'Annabid',images:[{url:`${SITE_URL}/images/services/marrakech-hero-panoramic.jpg`,width:2172,height:724,alt:title}]},twitter:{...metadata.twitter,title:`${title} | Annabid`}};
}
export function ServicesStructuredData({locale,roots,path=[]}:{locale:Locale;roots:SearchCategoryNode[];path?:SearchCategoryNode[]}) {
  const copy=servicesCopy(locale);
  const node=path.at(-1);
  const route=node?serviceCategoryHref(roots,node.id):'/services';
  const url=localizedUrl(locale,route);
  const items=node?.children?.length===1 && node.children[0].children?.length ? node.children[0].children : node?.children?.length ? node.children : node ? [node] : roots;
  const crumbs=[{name:'Annabid',url:localizedUrl(locale,'/')},{name:copy.directory,url:localizedUrl(locale,'/services')},...path.map(item=>({name:getCategoryLabel(item,locale),url:localizedUrl(locale,serviceCategoryHref(roots,item.id))}))];
  const graph={'@context':'https://schema.org','@graph':[
    {'@type':'CollectionPage','@id':`${url}#page`,url,name:node?`${getCategoryLabel(node,locale)} ${copy.categoryPage}`:copy.directory,description:node?copy.categoryDescription:copy.description,inLanguage:locale,mainEntity:{'@id':`${url}#categories`}},
    {'@type':'ItemList','@id':`${url}#categories`,itemListElement:items.map((item,index)=>({'@type':'ListItem',position:index+1,name:getCategoryLabel(item,locale),url:localizedUrl(locale,serviceCategoryHref(roots,item.id))}))},
    {'@type':'BreadcrumbList',itemListElement:crumbs.map((crumb,index)=>({'@type':'ListItem',position:index+1,name:crumb.name,item:crumb.url}))},
  ]};
  return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(graph).replace(/</g,'\\u003c')}}/>;
}
export function ServicesLocalGuide({locale,roots,path=[]}:{locale:Locale;roots:SearchCategoryNode[];path?:SearchCategoryNode[]}) {
  const copy=servicesCopy(locale);
  return <section className="svc-local-guide">
    {path.length>0 && <nav aria-label="Breadcrumb"><a href={localizedUrl(locale,'/services')}>{copy.directory}</a>{path.map(node=><a key={node.id} href={localizedUrl(locale,serviceCategoryHref(roots,node.id))}>{getCategoryLabel(node,locale)}</a>)}</nav>}
    <h2>{path.length?`${getCategoryLabel(path[path.length-1],locale)} ${copy.categoryPage}`:copy.browse}</h2>
    <p>{path.length?copy.categoryDescription:copy.browseHelp}</p>
  </section>;
}
