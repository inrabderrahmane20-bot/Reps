const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
const { NextRequest } = require('next/server');
const moduleFixture = { exports: {} };
const compiled = ts.transpileModule(fs.readFileSync('src/middleware.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
let localizedRequests = 0;
new Function('require', 'module', 'exports', compiled)(name => {
  if (name === 'next-intl/middleware') return () => () => {
    localizedRequests++;
    return require('next/server').NextResponse.next();
  };
  if (name === './i18n/config') return { locales: ['en', 'fr', 'ar'], defaultLocale: 'fr' };
  return require(name);
}, moduleFixture, moduleFixture.exports);
const middleware = moduleFixture.exports.default;

test('all locale aliases preserve admin destinations and query strings', () => {
  for (const locale of ['fr', 'en', 'ar']) {
    for (const [source, target] of [['/admin', '/admin/'], ['/admin/', '/admin/'], ['/admin/users/', '/admin/users/'], ['/admin/visual-editor/home/?locale=fr', '/admin/visual-editor/home/?locale=fr'], ['/admin/login/', '/admin/']]) {
      const response = middleware(new NextRequest(`https://annabid.com/${locale}${source}`));
      assert.equal(response.status, 308);
      assert.equal(response.headers.get('location'), `https://annabid.com${target}`);
    }
  }
});

test('legacy login converges on the canonical entry without a redirect loop', () => {
  const response = middleware(new NextRequest('https://annabid.com/admin/login/?from=old'));
  assert.equal(response.headers.get('location'), 'https://annabid.com/admin/?from=old');
  const canonical = middleware(new NextRequest('https://annabid.com/admin/'));
  assert.equal(canonical.status, 200);
  assert.equal(canonical.headers.get('location'), null);
  assert.match(canonical.headers.get('content-security-policy'), /nonce-/);
});

test('public paths still use locale routing, including names starting with admin', () => {
  localizedRequests = 0;
  middleware(new NextRequest('https://annabid.com/administrator/'));
  middleware(new NextRequest('https://annabid.com/fr/services/'));
  assert.equal(localizedRequests, 2);
});
