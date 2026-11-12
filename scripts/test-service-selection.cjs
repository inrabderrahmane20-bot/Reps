// Run with: node scripts/test-service-selection.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const module = { exports: {} };
  cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  function localRequire(name) {
    if (!name.startsWith('.') && !name.startsWith('@/')) return require(name);
    let resolved = name.startsWith('@/') ? path.resolve('src', name.slice(2)) : path.resolve(path.dirname(file), name);
    if (!path.extname(resolved)) resolved += '.ts';
    return load(resolved);
  }
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  return module.exports;
}
const { categoryPath, categoryBranchValues } = load('src/lib/service-selection.ts');
function node(id, fr, children = []) {
  return { id, slug: fr.toLowerCase(), labels: { fr, en: `English ${fr}` }, children };
}
const tree = [node('services', 'Services', [
  node('tech', 'Technique', [node('electrician', 'Électricien', [
    node('installation', 'Installation', [node('electric-house', 'Maison'), node('electric-flat', 'Appartement')]),
  ])]),
  node('animals', 'Animaux', [node('animal-house', 'Maison')]),
])];
assert.deepEqual(categoryPath(tree, 'electric-house').map(n => n.id), ['services', 'tech', 'electrician', 'installation', 'electric-house']);
assert.equal(categoryPath(tree, 'deleted'), null);
const branch = categoryBranchValues(categoryPath(tree, 'electrician').at(-1));
assert(branch.has('electricien')); // accent-insensitive legacy category values
assert(branch.has('english électricien'.normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
assert(branch.has('electric-house'));
assert(!branch.has('animal-house')); // duplicate labels do not confuse stable IDs
assert(!branch.has('animaux'));
tree[0].children[0].children[0].labels.fr = 'Électricien renommé';
assert.equal(categoryPath(tree, 'electrician').at(-1).labels.fr, 'Électricien renommé');
assert(categoryBranchValues(categoryPath(tree, 'electrician').at(-1)).has('electricien renomme'));
console.log('Service selection checks passed: nested IDs, translated labels, parent categories, renames, missing nodes, and branch isolation.');

(async () => {
  const { categoryTreeToNodes } = load('src/lib/category-tree.ts');
  const original = [node('services', 'Services', [node('trade', 'Plombier', [node('leaf', 'Installation unique')])])];
  const db = {
    categories: categoryTreeToNodes(original), categoryTreeInitialized: true,
    users: [{ provider: { category: 'Plombier' } }, { provider: { category: 'Installation unique' } }],
  };
  cache.set(path.resolve('src/lib/db.ts'), { exports: {
    readCategoryState: async () => db,
    updateDb: async update => update(db),
  } });
  const store = load('src/lib/category-store.ts');
  const renamed = structuredClone(original);
  renamed[0].children[0].labels.fr = 'Plombier renommé';
  renamed[0].children[0].children[0].labels.fr = 'Installation renommée';
  await store.saveCategoryTree(renamed);
  assert.equal(db.users[0].provider.category, 'Plombier renommé');
  assert.equal(db.users[1].provider.category, 'Installation renommée');
  assert.equal((await store.getCategoryTree())[0].children[0].labels.fr, 'Plombier renommé');
  console.log('Admin save checks passed: parent/leaf renames preserve provider links and persist the updated tree.');
})().catch(error => { console.error(error); process.exitCode = 1; });
