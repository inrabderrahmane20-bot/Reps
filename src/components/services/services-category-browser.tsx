'use client';
import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useLocale } from 'next-intl';
import { ArrowRight, Check, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { categoryPath } from '@/lib/service-selection';
import { getCategoryLabel, type SearchCategoryNode } from '@/lib/category-tree';
import { branchSearchCount, flattenServiceCategories, matchesCategory, serviceCategoryHref, type CategorySearchCounts } from '@/lib/services-browser';
import { servicesCopy } from '@/lib/services-copy';
import { CategoryPhoto } from './category-photo';

function selectInline(event: MouseEvent<HTMLAnchorElement>, callback: () => void) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault(); callback();
}
export function ServicesCategoryBrowser({ roots, root, activeId, onBrowse, onSelect, heading }: {
  heading?: string; roots: SearchCategoryNode[]; root: SearchCategoryNode; activeId: string | null;
  onBrowse: (id: string) => void; onSelect: (node: SearchCategoryNode) => void;
}) {
  const locale = useLocale();
  const copy = servicesCopy(locale);
  const [query,setQuery] = useState('');
  const [groupBy,setGroupBy] = useState('none');
  const [sort,setSort] = useState('admin');
  const [counts,setCounts] = useState<CategorySearchCounts>({});
  useEffect(() => {
    let active = true;
    fetch('/api/categories/popular/').then(response => response.ok ? response.json() : {counts:{}}).then(data => {if(active) setCounts(data.counts ?? {});}).catch(() => {});
    return () => {active=false;};
  }, []);
  useEffect(() => {setQuery('');}, [root.id,activeId]);
  const path = categoryPath([root], activeId ?? '') ?? [root,...(root.children?.[0] ? [root.children[0]] : [])];
  const current = path[path.length-1];
  const selectedLeft = path[1]?.id;
  const allNodes = useMemo(() => flattenServiceCategories(roots),[roots]);
  const popular = allNodes.filter(node => (counts[node.id] ?? 0)>0).sort((a,b) => counts[b.id]-counts[a.id]).slice(0,4);
  const ordered = (nodes: SearchCategoryNode[]) => [...nodes].filter(node => matchesCategory(node,query)).sort((a,b) => sort==='alpha' ? getCategoryLabel(a,locale).localeCompare(getCategoryLabel(b,locale),locale) : sort==='popular' ? branchSearchCount(b,counts)-branchSearchCount(a,counts) : 0);
  const wrapper = current.children?.length===1 && current.children[0].children?.length ? current.children[0] : null;
  const children = wrapper?.children ?? (current.children?.length ? current.children : [current]);
  const groups = groupBy === 'parent' ? ordered(children).map(node => ({id:node.id,title:getCategoryLabel(node,locale),items:ordered(node.children?.length ? node.children : [node])})) : [{id:current.id,title:wrapper ? getCategoryLabel(wrapper,locale) : '',items:ordered(children)}];
  async function choose(node: SearchCategoryNode) {
    onSelect(node);
    try {
      const key = `annabid.category-search.${node.id}.${new Date().toISOString().slice(0,10)}`;
      if (sessionStorage.getItem(key)) return;
      const response = await fetch('/api/categories/popular/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({categoryId:node.id})});
      if (response.ok) {sessionStorage.setItem(key,'1'); const data=await response.json();setCounts(data.counts ?? counts);}
    } catch { /* Analytics must never interrupt a search. */ }
  }
  const card = (node: SearchCategoryNode, compact = false) => <Link key={node.id} href={serviceCategoryHref(roots,node.id)} className={compact ? 'svc-branch-card' : 'svc-choice-card'} data-category-id={node.id} aria-current={node.id===current.id?'true':undefined} onClick={event => selectInline(event,()=>onBrowse(node.id))}>
    <span className="svc-choice-photo"><CategoryPhoto node={node} fallbackKey={root.slug} alt={getCategoryLabel(node,locale)} sizes={compact?'72px':'(min-width: 1024px) 22vw, 45vw'}/></span>
    <span className="svc-choice-name">{getCategoryLabel(node,locale)}{node.children?.length ? <small>{node.children.length} {copy.subcategories.toLocaleLowerCase(locale)}</small> : null}</span>
    {node.id===current.id ? <Check size={18} aria-hidden/> : <ChevronRight size={18} className="flip-rtl" aria-hidden/>}
  </Link>;
  return <div className="svc-browse-layout" data-services-category-browser="true">
    <section className="svc-browser-panel" aria-label={copy.categories}>
      <header className="svc-browser-heading"><div><span className="svc-section-eyebrow">{heading ?? copy.choose}</span><h2>{getCategoryLabel(root,locale)}</h2></div><SlidersHorizontal size={23} aria-hidden/></header>
      <div className="svc-browser-columns">
        <aside className="svc-branch-nav" aria-label={copy.subcategories}>
          <h3>{copy.subcategories}</h3>
          <nav>{(root.children?.length?root.children:[root]).map(node => <Link key={node.id} href={serviceCategoryHref(roots,node.id)} className={`svc-branch-card${node.id===selectedLeft || node.id===current.id ? ' is-selected':''}`} aria-current={node.id===selectedLeft || node.id===current.id?'true':undefined} data-category-id={node.id} onClick={event => selectInline(event,()=>onBrowse(node.id))}>
            <span className="svc-choice-photo"><CategoryPhoto node={node} fallbackKey={root.slug} alt={getCategoryLabel(node,locale)} sizes="72px"/></span><span className="svc-choice-name">{getCategoryLabel(node,locale)}</span><ChevronRight size={16} className="flip-rtl" aria-hidden/>
          </Link>)}</nav>
        </aside>
        <div className="svc-browser-detail">
          <nav className="svc-browser-breadcrumb" aria-label="Breadcrumb">{path.map((node,index)=><span key={node.id}>{index>0 && <ChevronRight size={13} className="flip-rtl" aria-hidden/>}<Link href={serviceCategoryHref(roots,node.id)} onClick={event=>selectInline(event,()=>onBrowse(node.id))}>{getCategoryLabel(node,locale)}</Link></span>)}</nav>
          <div className="svc-detail-heading"><div><h3>{getCategoryLabel(current,locale)}</h3><p>{copy.branchHelp}</p></div><button type="button" className="svc-browse-apply" onClick={()=>void choose(current)}>{copy.professionals}<ArrowRight size={17} className="flip-rtl" aria-hidden/></button></div>
          <div className="svc-category-tools">
            <label className="svc-category-query"><Search size={17} aria-hidden/><span className="sr-only">{copy.search}</span><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder={copy.search}/></label>
            <label>{copy.groupBy}<select aria-label={copy.groupBy} value={groupBy} onChange={event=>setGroupBy(event.target.value)}><option value="none">{copy.ungrouped}</option><option value="parent">{copy.parent}</option></select></label>
            <label>{copy.sort}<select aria-label={copy.sort} value={sort} onChange={event=>setSort(event.target.value)}><option value="admin">{copy.adminOrder}</option><option value="alpha">{copy.alphabetical}</option><option value="popular">{copy.popular}</option></select></label>
          </div>
          {groups.some(group=>group.items.length) ? groups.map(group=><section key={group.id} className="svc-choice-group">{group.title && <h4>{group.title}</h4>}<div className="svc-choice-grid">{group.items.map(node=>card(node))}</div></section>) : <p role="status" className="svc-browser-empty">{copy.noMatches}</p>}
          {!current.children?.length && <button type="button" className="svc-browse-apply svc-leaf-apply" onClick={()=>void choose(current)}>{copy.apply}<ArrowRight size={18} className="flip-rtl" aria-hidden/></button>}
        </div>
      </div>
    </section>
    {popular.length>0 && <section className="svc-popular-section" aria-labelledby="svc-popular-title"><div className="svc-detail-heading"><div><h2 id="svc-popular-title">{copy.popular}</h2><p>{copy.popularHelp}</p></div></div><div className="svc-popular-grid">{popular.map(node=><div key={node.id}>{card(node)}<span className="svc-search-count">{counts[node.id]} {copy.searchCount}</span></div>)}</div></section>}
  </div>;
}
