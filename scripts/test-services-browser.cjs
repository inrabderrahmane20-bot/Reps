// Pure regression tests for live category URLs, selection, image fallbacks and localized SEO.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const cache=new Map();
function load(file){
 file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;
 if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
 const module={exports:{}};cache.set(file,module);
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 function localRequire(name){if(name==='next-intl/server')return{getTranslations:async()=>Object.assign(key=>key==='siteName'?'Annabid':key,{has:()=>false})};
 if(!name.startsWith('.')&&!name.startsWith('@/'))return require(name);
 let target=name.startsWith('@/')?path.resolve('src',name.slice(2)):path.resolve(path.dirname(file),name);
 if(!path.extname(target))target+=fs.existsSync(target+'.ts')?'.ts':'.tsx';return load(target);}
 new Function('require','module','exports',code)(localRequire,module,module.exports);return module.exports;
}
cache.set(path.resolve('src/lib/db.ts'),{exports:{readDb:async()=>({users:[]})}});
const model=load('src/lib/services-browser.ts');
const {SEARCH_CATEGORIES}=load('src/lib/category-tree.ts');
const {categoryImage}=load('src/lib/category-images.ts');
const {servicesMetadata}=load('src/components/services/services-seo.tsx');
const roots=model.serviceRoots(SEARCH_CATEGORIES);
const technique=model.defaultServiceRoot(roots);assert.match(technique.slug,/technique/);
const all=model.flattenServiceCategories(roots);
const hrefs=new Set();
for(const node of all){
 const href=model.serviceCategoryHref(roots,node.id);assert(!hrefs.has(href),'Duplicate category URL: '+href);hrefs.add(href);
 const slugs=href.split('/').slice(3).filter(Boolean).map(decodeURIComponent);
 assert.equal(model.resolveServiceCategory(roots,slugs).at(-1).id,node.id);
 const image=categoryImage(node,technique.slug);assert(image && fs.existsSync(path.join('public',image)),'Missing category fallback: '+image);
}
assert.equal(model.resolveServiceCategory(roots,['not-a-category']),null);
assert.equal(model.serviceCategoryHref(roots,'unknown'),'/services');
assert(model.matchesCategory(technique,'electricien'));
assert(model.matchesCategory(technique,'ÉLECTRICIEN'));
assert(!model.matchesCategory(technique,'zzzz-nothing-matches'));
assert.equal(model.branchSearchCount(technique,{[technique.children[0].id]:4,[technique.id]:2}),6);
const duplicate=[{id:'a',slug:'same',labels:{en:'One'}},{id:'b',slug:'same',labels:{en:'Two'}}];
assert.notEqual(model.serviceCategoryHref(duplicate,'a'),model.serviceCategoryHref(duplicate,'b'));
assert.equal(model.resolveServiceCategory(duplicate,['same--b']).at(-1).id,'b');
assert.equal(categoryImage({...technique,image:'/uploads/my-photo.png'}),'/uploads/my-photo.png');
(async()=>{
 for(const locale of ['en','fr','ar']){
  const meta=await servicesMetadata(locale,roots);
  assert.equal(meta.alternates.canonical,`https://annabid.com/${locale}/services/`);
  assert.equal(meta.alternates.languages.fr,'https://annabid.com/fr/services/');
  assert.match(meta.title,/Annabid/);assert.equal(meta.robots.index,true);
  assert.equal((await servicesMetadata(locale,roots,[],true)).robots.index,false);
  const leaf=all.find(node=>!node.children?.length);
  const leafPath=load('src/lib/service-selection.ts').categoryPath(roots,leaf.id);
  assert.equal((await servicesMetadata(locale,roots,leafPath)).robots.index,false,'Empty leaf category should not be indexed');
 }
 console.log(`Services model/SEO tests passed: ${all.length} unique crawlable category URLs, image fallback coverage, default selection, filtering, aggregate counts, locale canonicals and empty-leaf indexing.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
