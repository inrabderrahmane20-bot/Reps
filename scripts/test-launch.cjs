// Exercise actual route handlers with an isolated in-memory database and cookie jar.
// No real accounts, messages, uploads or production records are changed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { NextRequest } = require('next/server');
const cache = new Map();
let token;
let serial = 0;
const seed = JSON.parse(fs.readFileSync('src/data/db.seed.json', 'utf8'));
const db = Object.fromEntries(Object.entries(seed).map(([key, value]) => [key, Array.isArray(value) ? [] : value]));
const dbMock = {
  readDb: async () => structuredClone(db),
  updateDb: async (fn) => fn(db),
  readCategoryState: async () => ({ categories: [], categoryTreeInitialized: false }),
  readSessionUser: async (value) => {
    const session = db.sessions.find((s) => s.token === value);
    return session ? { session, user: db.users.find((u) => u.id === session.userId) } : null;
  },
  newId: (prefix) => `${prefix}_test_${++serial}`,
};
const cookies = { get: () => token ? { value: token } : undefined, set: (_name, value) => { token = value; }, delete: () => { token = undefined; } };
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const module = { exports: {} }; cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  function localRequire(name) {
    if (name === 'next/headers') return { cookies: () => cookies };
    if (name === 'next-intl/server') return { getTranslations: async ({ namespace, locale = 'en' }) => {
      const messages = require(`../src/messages/${locale}.json`)[namespace];
      return (key, values = {}) => String(messages[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => values[k] ?? k);
    } };
    if (!name.startsWith('.') && !name.startsWith('@/')) return require(name);
    let target = name.startsWith('@/') ? path.resolve('src', name.slice(2)) : path.resolve(path.dirname(file), name);
    if (!path.extname(target)) target += fs.existsSync(target + '.ts') ? '.ts' : '.tsx';
    return load(target);
  }
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  return module.exports;
}
cache.set(path.resolve('src/lib/db.ts'), { exports: dbMock });
const auth = load('src/lib/auth.ts');
function account(id, role = 'user', provider = false) {
  const password = auth.hashPassword('Launch-test-password!');
  return { id, email: `${id}@example.test`, passwordHash: password.hash, salt: password.salt,
    firstName: id, lastName: 'Test', role, status: 'active', providerStatus: provider ? 'approved' : 'none',
    provider: provider ? { category: 'Électricien', title: 'Électricien local', description: 'Test fixture', availability: 'available',
      specialties: [], serviceArea: 'Marrakech', priceRange: '100 MAD', lat: 31.6295, lng: -8.0089,
      portfolio: ['/test.jpg'], documents: ['PRIVATE-DOCUMENT'], insights: { views: 1 },
      sponsored: { active: true, priority: 1, startDate: '2020-01-01', endDate: '2099-01-01', notes: 'PRIVATE-NOTE' },
    } : null,
    city: 'Marrakech', neighborhood: 'Medina', avatar: '', languages: [], interests: [], bio: '', blockedUserIds: [],
    homeLat: 32.12345, homeLng: -7.12345, createdAt: new Date().toISOString() };
}
db.users.push(account('admin', 'admin'), account('client'), account('provider', 'user', true), account('other'));
function signIn(id) {
  token = `test-${id}`;
  db.sessions = db.sessions.filter((s) => s.token !== token);
  db.sessions.push({ token, userId: id, expiresAt: '2099-01-01', createdAt: new Date().toISOString() });
}
let checks = 0;
async function call(route, method = 'GET', body, params = {}, query = '') {
  const handler = load(`src/app/api/${route}/route.ts`)[method];
  const response = await handler(new NextRequest(`http://localhost/api/${route}${query}`, {
    method, ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }),
  }), { params });
  const data = await response.json();
  return { status: response.status, data };
}
function status(response, expected) { assert.equal(response.status, expected, JSON.stringify(response.data)); checks++; return response.data; }
function ok(value, message) { assert(value, message); checks++; }
function routeFiles(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? routeFiles(path.join(dir, entry.name)) : entry.name === 'route.ts' ? [path.join(dir, entry.name)] : []); }

async function run() {
  // Every administrative handler must stop before reading/mutating data.
  for (const file of routeFiles('src/app/api/admin')) {
    const route = path.relative('src/app/api', path.dirname(file)).split(path.sep).join('/');
    const handlers = load(file);
    for (const method of ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].filter((m) => handlers[m])) {
      token = undefined; status(await call(route, method, method === 'GET' ? undefined : {}, { id: 'provider', documentId: 'home' }), 401);
      signIn('client'); status(await call(route, method, method === 'GET' ? undefined : {}, { id: 'provider', documentId: 'home' }), 403);
    }
  }
  signIn('admin'); status(await call('admin/users'), 200);
  db.users[0].status = 'suspended'; status(await call('admin/users'), 401); db.users[0].status = 'active';
  token = undefined;
  status(await call('auth/register', 'POST', { firstName: 'Test', lastName: 'Person', email: 'bad', password: 'abcdef' }), 400);
  const registration = status(await call('auth/register', 'POST', { firstName: 'New', lastName: 'Account', email: 'new@example.test', password: 'Launch-test-password!' }), 201);
  const registeredId = registration.user.id;
  status(await call('users/me', 'PATCH', { bio: 'Saved profile', role: 'admin' }), 200);
  const me = status(await call('auth/me'), 200).user;
  ok(me.bio === 'Saved profile' && me.role === 'user', 'Profile edit must not elevate privileges');
  status(await call('auth/logout', 'POST'), 200);
  ok((await call('auth/me')).data.user === null, 'Logout invalidates the session');
  status(await call('auth/login', 'POST', { email: 'new@example.test', password: 'wrong' }), 401);
  status(await call('auth/login', 'POST', { email: 'new@example.test', password: 'Launch-test-password!' }), 200);
  ok((await call('auth/me')).data.user.id === registeredId, 'Login restores account');

  const found = status(await call('providers', 'GET', undefined, {}, '?q=electricien&availability=available&minRating=0&sort=alpha'), 200);
  ok(found.total === 1, 'Accent-insensitive service search');
  status(await call('providers', 'GET', undefined, {}, '?limit=bad&offset=bad'), 200);
  ok((await call('providers', 'GET', undefined, {}, '?q=no-such-service')).data.total === 0, 'No results');
  ok((await call('providers', 'GET', undefined, {}, '?availability=offline')).data.total === 0, 'Availability filtering');
  ok((await call('providers', 'GET', undefined, {}, '?cat=Électricien')).data.total === 1, 'Category filter');
  ok((await call('providers', 'GET', undefined, {}, '?minRating=5')).data.total === 0, 'Unrated providers do not match minimum score');
  const detail = status(await call('providers/[id]', 'GET', undefined, { id: 'provider' }), 200).provider;
  const serialized = JSON.stringify(detail);
  ok(!serialized.includes('PRIVATE') && !serialized.includes('homeLat') && !serialized.includes('passwordHash'), 'Public profile excludes private data');
  db.users.find((u) => u.id === 'provider').status = 'banned';
  status(await call('providers/[id]', 'GET', undefined, { id: 'provider' }), 404);
  ok((await call('map/points')).data.providers.length === 0, 'Map hides banned providers');
  db.users.find((u) => u.id === 'provider').status = 'active';

  signIn('client');
  status(await call('requests', 'POST', {}), 400);
  const request = status(await call('requests', 'POST', { providerId: 'provider', description: 'Repair a light', location: 'Marrakech', date: '2026-12-01' }), 201);
  signIn('other'); status(await call('requests/[id]', 'PATCH', { status: 'completed' }, { id: request.id }), 403);
  signIn('client'); status(await call('requests/[id]', 'PATCH', { status: 'completed' }, { id: request.id }), 409);
  signIn('provider');
  ok((await call('notifications')).data.notifications.some((n) => n.type === 'service_request'), 'Provider receives request notification');
  status(await call('requests/[id]', 'PATCH', { status: 'accepted' }, { id: request.id }), 200);
  signIn('client'); status(await call('requests/[id]', 'PATCH', { status: 'completed' }, { id: request.id }), 200);
  status(await call('reviews', 'POST', { requestId: request.id, rating: 'invalid', content: 'Review' }), 400);
  status(await call('reviews', 'POST', { requestId: request.id, rating: 5, content: 'Completed successfully' }), 201);
  status(await call('reviews', 'POST', { requestId: request.id, rating: 5, content: 'Duplicate' }), 400);
  ok((await call('providers', 'GET', undefined, {}, '?minRating=5')).data.total === 1, 'Real review average used in filters');

  const favorite = { type: 'provider', targetId: 'provider' };
  status(await call('favorites', 'POST', favorite), 200); status(await call('favorites', 'POST', favorite), 200);
  ok((await call('favorites')).data.items.length === 1, 'Favorites are idempotent');
  signIn('other'); ok((await call('favorites')).data.items.length === 0, 'Favorites isolated by account');
  signIn('client'); status(await call('favorites', 'DELETE', undefined, {}, '?type=provider&targetId=provider'), 200);
  ok((await call('favorites')).data.items.length === 0, 'Favorite removal persists');
  status(await call('conversations', 'POST', { userId: 'provider' }), 201);
  ok((await call('conversations')).data.conversations.length === 1, 'Provider contact creates private conversation');
  const report = status(await call('reports', 'POST', { targetType: 'provider', targetId: 'provider', reason: 'Test report' }), 201);
  signIn('admin'); status(await call('admin/reports/[id]', 'PATCH', { status: 'under_review' }, { id: report.id }), 200);
  status(await call('admin/reports/[id]', 'PATCH', { status: 'resolved' }, { id: report.id }), 200);

  signIn('provider');
  status(await call('providers/apply', 'POST', { category: 'Électricien', title: 'Updated title', description: 'Updated description' }), 200);
  ok(db.users.find((u) => u.id === 'provider').provider.portfolio.length === 1, 'Resubmission preserves photos');
  status(await call('providers/[id]', 'GET', undefined, { id: 'provider' }), 404);
  signIn('admin'); status(await call('admin/providers/[id]', 'PATCH', { action: 'approve' }, { id: 'provider' }), 200);
  ok((await call('providers/[id]', 'GET', undefined, { id: 'provider' })).data.provider.provider.title === 'Updated title', 'Approved changes appear publicly');

  // Message key parity and ICU argument parity across all three catalogues.
  const flatten = (obj, prefix = '') => Object.entries(obj).flatMap(([key, value]) => typeof value === 'object' ? flatten(value, `${prefix}${key}.`) : [[`${prefix}${key}`, value]]);
  const base = new Map(flatten(require('../src/messages/en.json')));
  for (const locale of ['fr', 'ar']) {
    const translated = new Map(flatten(require(`../src/messages/${locale}.json`)));
    assert.deepEqual([...translated.keys()].sort(), [...base.keys()].sort()); checks++;
    for (const [key, value] of base) {
      const args = (str) => {
        const names = new Set();
        const walk = (nodes) => { for (const node of nodes) {
          if ([1, 2, 3, 4, 5, 6].includes(node.type)) names.add(node.value);
          if (node.options) Object.values(node.options).forEach((option) => walk(option.value));
          if (node.children) walk(node.children);
        } };
        walk(require('@formatjs/icu-messageformat-parser').parse(str));
        return [...names].sort();
      };
      assert.deepEqual(args(translated.get(key)), args(value), `${locale}:${key}`);
      ok(translated.get(key).trim().length > 0, `Empty translation ${locale}:${key}`);
    }
  }
  console.log(`PASS: ${checks} launch assertions (isolated fixture data; no production validation).`);
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
