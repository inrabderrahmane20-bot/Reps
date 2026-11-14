// Run: node scripts/test-visual-editor.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { NextIntlClientProvider } = require('next-intl');
const cache = new Map();
let currentPath = '/services';
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const module = { exports: {} }; cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  function localRequire(name) {
    if (name === 'next/navigation') return { useRouter: () => ({ push() {}, replace() {} }), usePathname: () => currentPath, useSearchParams: () => new URLSearchParams() };
    if (!name.startsWith('.') && !name.startsWith('@/')) return require(name);
    let resolved = name.startsWith('@/') ? path.resolve('src', name.slice(2)) : path.resolve(path.dirname(file), name);
    if (!path.extname(resolved)) resolved += fs.existsSync(`${resolved}.ts`) ? '.ts' : '.tsx';
    return load(resolved);
  }
  new Function('require','module','exports',code)(localRequire,module,module.exports);
  return module.exports;
}
cache.set(path.resolve('src/i18n/navigation.ts'), { exports: {
  Link: ({ locale, ...props }) => React.createElement('a', props), usePathname: () => currentPath,
  useRouter: () => ({ replace() {}, push() {} }),
} });
cache.set(path.resolve('src/context/auth-context.tsx'), { exports: { useAuth: () => ({ user: null, loading: false, logout() {} }) } });
const records = new Map();
cache.set(path.resolve('src/lib/db.ts'), { exports: {
  readVisualEditorRecord: async key => structuredClone(records.get(key) ?? null),
  mutateVisualEditorRecord: async (key, mutate) => { const value = mutate(structuredClone(records.get(key) ?? null)); records.set(key, value); return structuredClone(value); },
} });
const { sanitizeDocument, validateImage } = load('src/lib/visual-editor/validation.ts');
const { safeUrl, sanitizeRichText, sanitizeStyles, styleObject } = load('src/lib/visual-editor/sanitize.ts');
const { defaultDocument, navbarDefaults, footerDefaults, editorMessages } = load('src/lib/visual-editor/defaults.ts');
const store = load('src/lib/visual-editor/store.ts');
const { Navbar } = load('src/components/layout/navbar.tsx');
const { Hero } = load('src/components/home/hero.tsx');
const { ServicesHero } = load('src/components/services/services-hero.tsx');
const { Footer } = load('src/components/layout/footer.tsx');
const { CategoryGrid } = load('src/components/home/category-grid.tsx');
const { CategoryAppearanceProvider } = load('src/components/category-appearance.tsx');
const { SEARCH_CATEGORIES } = load('src/lib/category-tree.ts');
const categoryAppearance = [{ categoryId: 'services', mobileSize: 'icon', icon: 'Wrench', iconSrc: '/images/categories/services.jpg' }];
const categoryDocument = defaultDocument('home', 'en');
categoryDocument.root.props.categoryAppearance = categoryAppearance;
assert.deepEqual(sanitizeDocument(categoryDocument, 'home').root.props.categoryAppearance, categoryAppearance);
const unsafeIcon = structuredClone(categoryDocument);
unsafeIcon.root.props.categoryAppearance[0].iconSrc = 'javascript:alert(1)';
assert.equal(sanitizeDocument(unsafeIcon, 'home').root.props.categoryAppearance[0].iconSrc, '');
for (const patch of [{ mobileSize: 'giant' }, { icon: 'UnknownIcon' }, { categoryId: '' }]) {
  const invalid = structuredClone(categoryDocument);
  Object.assign(invalid.root.props.categoryAppearance[0], patch);
  assert.throws(() => sanitizeDocument(invalid, 'home'));
}
const duplicateAppearance = structuredClone(categoryDocument);
duplicateAppearance.root.props.categoryAppearance.push(categoryAppearance[0]);
assert.throws(() => sanitizeDocument(duplicateAppearance, 'home'));
function renderCategories(settings) {
  return renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale: 'en', messages: editorMessages.en, timeZone: 'Africa/Casablanca' },
    React.createElement(CategoryAppearanceProvider, { value: settings }, React.createElement(CategoryGrid, { categories: SEARCH_CATEGORIES }))));
}
const iconMarkup = renderCategories(categoryAppearance);
assert.match(iconMarkup, /data-category-id="services" data-mobile-size="icon"/);
assert.equal((iconMarkup.match(/class="category-mobile-icon"/g) ?? []).length, 1, 'Only the chosen category gets an icon');
assert.match(iconMarkup, /class="home-discovery-media"/, 'Keep desktop photography');
assert(!renderCategories([]).includes('class="category-mobile-icon"'), 'Regular mode restores photographs');
function render(component, locale, content) {
  return renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale, messages: editorMessages[locale], timeZone: 'Africa/Casablanca' }, React.createElement(component, content ? { content } : {})));
}
for (const locale of ['en','fr','ar']) {
  for (const route of ['/','/services']) {
    currentPath = route;
    assert.equal(render(Navbar, locale), render(Navbar, locale, navbarDefaults(locale)), `Navbar defaults changed for ${locale} ${route}`);
    assert.equal(render(Footer, locale), render(Footer, locale, footerDefaults(locale)), `Footer defaults changed for ${locale} ${route}`);
  }
  assert.equal(render(Hero, locale), render(Hero, locale, defaultDocument('home', locale).content[0].props.content), `Home hero defaults changed for ${locale}`);
  assert.equal(render(ServicesHero, locale), render(ServicesHero, locale, defaultDocument('services', locale).content[0].props.content), `Services hero defaults changed for ${locale}`);
  for (const id of ['navbar','footer','services','home','privacy','terms','rules']) assert.doesNotThrow(() => sanitizeDocument(defaultDocument(id, locale), id));
}
assert.equal(safeUrl('javascript:alert(1)'), '');
assert.equal(safeUrl('//evil.example/x'), '');
assert.equal(safeUrl('/services'), '/services');
assert.equal(styleObject({ fontFamily: 'var(--font-display), serif' }).fontFamily, 'var(--font-display), serif');
assert.equal(styleObject({ fontFamily: 'var(--untrusted)' }).fontFamily, undefined);
assert(!sanitizeRichText('<p onclick="x()">Safe<script>alert(1)</script><img src=x onerror=x()></p>').includes('script'));
assert(!sanitizeRichText('<a href="javascript:alert(1)">X</a>').includes('javascript'));
assert.deepEqual(sanitizeStyles({ color: 'red;position:fixed', width: 'url(https://example.com)', customCss: 'position: fixed; color: #123; background-color: url(x); padding: 8px' }), { customCss: 'color: #123; padding: 8px' });
assert.throws(() => validateImage(Buffer.from('<svg></svg>'), 'image/png'));
assert.throws(() => validateImage(Buffer.alloc(4*1024*1024+1), 'image/png'));
assert.equal(validateImage(Buffer.from([137,80,78,71,13,10,26,10]), 'image/png'), 'png');
assert.throws(() => sanitizeDocument({ content: [{ type: 'Navbar', props: { id: 'x', content: {} } }] }, 'navbar'));
assert.throws(() => sanitizeDocument({ content: [{ type: 'Unknown', props: { id: 'x' } }] }, 'navbar'));
const nested = { root: { props: {} }, content: [{ type: 'Section', props: { id: 's', styleFields: {}, children: [{ type: 'RichText', props: { id: 'r', html: '<p>Safe<script>bad()</script></p>', styleFields: {} } }] } }] };
assert(!JSON.stringify(sanitizeDocument(nested, 'navbar')).includes('bad()'));
assert.throws(() => sanitizeDocument(defaultDocument('services','en'), 'navbar'));
assert.throws(() => sanitizeDocument(defaultDocument('navbar','en'), 'services'));
const serviceImage = defaultDocument('services','en'); serviceImage.content[0].props.content.src = 'javascript:alert(1)';
assert.equal(sanitizeDocument(serviceImage,'services').content[0].props.content.src, '');
const duplicate = structuredClone(nested); duplicate.content[0].props.children[0].props.id = 's';
assert.throws(() => sanitizeDocument(duplicate, 'navbar'));
(async () => {
  let document = await store.readDocument('navbar','en');
  const data = defaultDocument('navbar','en'); data.content[0].props.content.brandName = 'Draft brand';
  document = await store.saveDocument('navbar','en','draft',document.revision,data);
  assert.equal(document.published, null); assert.equal(document.draft.content[0].props.content.brandName, 'Draft brand');
  document = await store.saveDocument('navbar','en','publish',document.revision,data);
  assert.equal(document.published.content[0].props.content.brandName, 'Draft brand');
  const next = structuredClone(data); next.content[0].props.content.brandName = 'Unpublished';
  document = await store.saveDocument('navbar','en','draft',document.revision,next);
  assert.equal(document.published.content[0].props.content.brandName, 'Draft brand');
  await assert.rejects(store.saveDocument('navbar','en','publish',0,next), store.RevisionConflict);
  assert.equal((await store.readDocument('navbar','fr')).published, null);
  assert.equal((await store.readDocument('footer','en')).published, null);
  document = await store.saveDocument('navbar','en','reset',document.revision);
  assert.equal(document.published, null); assert.equal(document.draft, null);
  let homeDocument = await store.readDocument('home', 'en');
  homeDocument = await store.saveDocument('home', 'en', 'draft', homeDocument.revision, categoryDocument);
  assert.equal(homeDocument.published, null);
  homeDocument = await store.saveDocument('home', 'en', 'publish', homeDocument.revision, categoryDocument);
  assert.deepEqual((await store.readDocument('home', 'en')).published.root.props.categoryAppearance, categoryAppearance);
  assert.equal((await store.readDocument('home', 'fr')).published, null);
  assert.equal((await store.readDocument('services', 'en')).published, null, 'Home icon settings must not leak to Services');
  const serviceDocument = defaultDocument('services', 'en');
  serviceDocument.root.props.categoryAppearance = [{ ...categoryAppearance[0], icon: 'Car' }];
  await store.saveDocument('services', 'en', 'publish', 0, serviceDocument);
  assert.equal((await store.readDocument('services', 'en')).published.root.props.categoryAppearance[0].icon, 'Car');
  assert.equal((await store.readDocument('home', 'en')).published.root.props.categoryAppearance[0].icon, 'Wrench');
  console.log('Category appearance checks passed: per-category rendering, safe uploads, validation, draft/publish persistence, and independent page/language settings.');
  console.log('Visual editor checks passed: unchanged Navbar/Footer defaults across 3 languages and both layouts; validation; nested sanitization; uploads; draft/publish/reset; locale isolation; revision conflicts.');
})().catch(error => { console.error(error); process.exitCode = 1; });

// Optional browser verification: node scripts/test-visual-editor.cjs --browser
if (process.argv.includes('--browser')) {
  (async () => {
    const os = require('node:os');
    const { chromium } = require(path.join(process.env.APPDATA, 'npm/node_modules/playwright-core'));
    const base = process.env.BASE_URL || 'http://localhost:3002';
    const browser = await chromium.launch({ executablePath: path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1223/chrome-win64/chrome.exe'), headless: true });
    const context = await browser.newContext({ viewport: { width: 1600, height: 1050 } });
    await context.addInitScript(() => { localStorage.setItem('medina.languageSelected', '1'); localStorage.setItem('medina.selectedLanguage', 'en'); });
    const publicPage = await context.newPage();
    const editor = await context.newPage();
    const pageErrors = [];
    editor.on('pageerror', error => pageErrors.push(error.message));
    const cleanup = new Set();
    let uploadedFilename;
    async function get(id) {
      const response = await context.request.get(`${base}/api/admin/visual-editor/documents/${id}/?locale=en`);
      assert.equal(response.status(), 200); return response.json();
    }
    async function save(id, action, data) {
      const { document } = await get(id);
      const response = await context.request.put(`${base}/api/admin/visual-editor/documents/${id}/?locale=en`, { data: { action, revision: document.revision, data } });
      assert.equal(response.status(), 200, await response.text()); return response.json();
    }
    async function capture(selector, route = '/en/services/') {
      await publicPage.goto(`${base}${route}`);
      await publicPage.locator('header.site-header img:visible').first().waitFor();
      await publicPage.evaluate(() => document.fonts.ready);
      await publicPage.waitForTimeout(400); // Let account/city hydration and layout effects settle before pixel comparison.
      return publicPage.locator(selector).screenshot({ animations: 'disabled' });
    }
    try {
      assert.equal((await context.request.get(`${base}/api/admin/visual-editor/documents/navbar/`)).status(), 401);
      assert.equal((await context.request.put(`${base}/api/admin/visual-editor/documents/navbar/`, { data: {} })).status(), 401);
      assert.equal((await context.request.post(`${base}/api/admin/visual-editor/upload/`)).status(), 401);
      assert.equal((await context.request.post(`${base}/api/auth/login/`, { data: { email: 'admin@medina.ma', password: 'admin123' } })).status(), 200);
      for (const id of ['navbar','footer']) {
        const existing = await get(id);
        if (existing.document.draft || existing.document.published) throw new Error(`Refusing to modify an existing ${id} document during tests.`);
        cleanup.add(id);
      }
      const originalRevision = (await get('navbar')).document.revision;
      const invalidDocument = await context.request.put(base + '/api/admin/visual-editor/documents/navbar/?locale=en', { data: { action: 'draft', revision: originalRevision, data: { content: [{ type: 'Unknown', props: { id: 'bad' } }] } } });
      assert.equal(invalidDocument.status(), 400);
      const conflict = await context.request.put(base + '/api/admin/visual-editor/documents/navbar/?locale=en', { data: { action: 'publish', revision: originalRevision + 1, data: (await get('navbar')).defaults } });
      assert.equal(conflict.status(), 409);
      const forbiddenOrigin = await context.request.put(base + '/api/admin/visual-editor/documents/navbar/?locale=en', { headers: { Origin: 'https://unrelated.example' }, data: {} });
      assert.equal(forbiddenOrigin.status(), 403);
      const badUpload = await context.request.post(base + '/api/admin/visual-editor/upload/', { multipart: { file: { name: 'spoof.png', mimeType: 'image/png', buffer: Buffer.from('<svg></svg>') } } });
      assert.equal(badUpload.status(), 400);
      const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6k8AAAAASUVORK5CYII=', 'base64');
      const upload = await context.request.post(base + '/api/admin/visual-editor/upload/', { multipart: { file: { name: 'valid.png', mimeType: 'image/png', buffer: png } } });
      assert.equal(upload.status(), 200, await upload.text());
      const media = await upload.json(); uploadedFilename = media.url.split('/').pop();
      const image = await context.request.get(base + media.url);
      assert.equal(image.status(), 200); assert.equal(image.headers()['content-type'], 'image/png');
      assert.equal(image.headers()['x-content-type-options'], 'nosniff');
      console.log('Upload API checks passed: authentication, spoofed type rejection, valid image upload and delivery.');
      const beforeNavbar = await capture('header.site-header');
      const initial = await get('navbar');
      await save('navbar','publish',initial.defaults);
      assert((await capture('header.site-header')).equals(beforeNavbar), 'Publishing Navbar defaults changed its pixels.');
      await publicPage.evaluate(() => window.scrollTo(0, 400));
      assert(Math.abs((await publicPage.locator('header.site-header').boundingBox()).y) < 1, 'Published Navbar no longer sticks to the viewport.');
      await publicPage.evaluate(() => window.scrollTo(0, 0));
      await save('navbar','reset');
      await publicPage.setViewportSize({ width: 390, height: 844 });
      const beforeMobile = await capture('header.site-header');
      const mobileDefaults = (await get('navbar')).defaults;
      await save('navbar','publish',mobileDefaults);
      const publishedMobile = await capture('header.site-header');
      if (!publishedMobile.equals(beforeMobile)) {
        const diagnosticPath = path.join(os.tmpdir(), 'norsalem-visual-editor-tests'); fs.mkdirSync(diagnosticPath, { recursive: true });
        fs.writeFileSync(path.join(diagnosticPath, 'mobile-default-before.png'), beforeMobile); fs.writeFileSync(path.join(diagnosticPath, 'mobile-default-after.png'), publishedMobile);
      }
      assert(publishedMobile.equals(beforeMobile), 'Publishing default Navbar changed the mobile header.');
      mobileDefaults.content[0].props.content.mobileLinks[0].label = 'Edited mobile navigation';
      mobileDefaults.content[0].props.content.brandName = 'Mobile brand test';
      await save('navbar','publish',mobileDefaults); await publicPage.reload();
      const menuLabel = editorMessages.en.nav.openMenu;
      await publicPage.getByRole('button', { name: menuLabel, exact: true }).click();
      await publicPage.getByText('Edited mobile navigation', { exact: true }).waitFor();
      assert((await publicPage.locator('.annabid-drawer-brand').innerText()).includes('Mobile brand test'));
      await save('navbar','reset');
      await publicPage.setViewportSize({ width: 1600, height: 1050 });
      console.log('Mobile Navbar checks passed: unchanged default pixels and published drawer links/branding.');
      await editor.goto(`${base}/admin/visual-editor/navbar/?locale=en`);
      const editingFrame = editor.frameLocator('iframe');
      await editingFrame.locator('header.site-header').waitFor();
      const headerBox = await editingFrame.locator('header.site-header').boundingBox();
      await editor.mouse.move(headerBox.x + headerBox.width / 2, headerBox.y + headerBox.height / 2);
      await editor.waitForTimeout(250); // Puck registers the hovered block overlay before the click.
      await editor.mouse.click(headerBox.x + headerBox.width / 2, headerBox.y + headerBox.height / 2);
      await editor.locator('input[name="content.brandName"]').waitFor();
      assert.notEqual(await editingFrame.locator('[data-puck-dropzone]').first().evaluate(element => getComputedStyle(element).display), 'contents', 'Editor dropzone must retain its box.');
      const brand = editor.locator('input[name="content.brandName"]');
      await brand.fill('Visual editor browser test'); await brand.blur();
      await editor.getByRole('button', { name: /^undo$/i }).click();
      await editor.waitForTimeout(150);
      const previewFrame = editor.frameLocator('iframe');
      assert(!(await previewFrame.locator('header.site-header').innerText()).includes('Visual editor browser test'), 'Undo did not restore the previous value.');
      await editor.getByRole('button', { name: /^redo$/i }).click();
      assert((await previewFrame.locator('header.site-header').innerText()).includes('Visual editor browser test'));
      await editor.getByRole('button', { name: 'Save draft', exact: true }).click();
      await editor.getByRole('status').filter({ hasText: 'Draft saved' }).waitFor();
      await publicPage.reload(); assert(!(await publicPage.locator('header.site-header').innerText()).includes('Visual editor browser test'));
      await editor.getByRole('button', { name: 'Publish', exact: true }).click();
      await editor.getByRole('status').filter({ hasText: 'Published to all pages' }).waitFor();
      await publicPage.reload(); assert((await publicPage.locator('header.site-header').innerText()).includes('Visual editor browser test'));
      await editor.getByRole('button', { name: 'Switch to Mobile viewport' }).click();
      await editor.waitForTimeout(300);
      const frame = editor.frames().find(frame => frame !== editor.mainFrame());
      assert(frame, 'Responsive preview iframe missing.');
      assert.equal(await frame.evaluate(() => window.innerWidth), 390);
      const out = path.join(os.tmpdir(), 'norsalem-visual-editor-tests'); fs.mkdirSync(out,{ recursive: true });
      await editor.screenshot({ path: path.join(out,'navbar-editor.png'), fullPage: true });
      editor.once('dialog', dialog => dialog.accept());
      await editor.getByRole('button', { name: 'Reset to default', exact: true }).click();
      await editor.getByRole('status').filter({ hasText: 'Default component restored' }).waitFor();
      await publicPage.reload(); assert(!(await publicPage.locator('header.site-header').innerText()).includes('Visual editor browser test'));
      console.log('Navbar browser checks passed: identical default pixels, field editing, undo/redo, private draft, public publish, mobile iframe, reset.');

      const nesting = (await get('navbar')).defaults;
      const text = (id, value) => ({ type: 'Text', props: { id, text: value, as: 'p', styleFields: {} } });
      const grid = { type: 'Grid', props: { id: 'test-grid', columns: 2, gap: 12, styleFields: {}, children: [
        { type: 'Column', props: { id: 'test-col-a', styleFields: {}, children: [text('test-first', 'Nested first test')] } },
        { type: 'Column', props: { id: 'test-col-b', styleFields: {}, children: [text('test-second', 'Nested second test')] } },
      ] } };
      nesting.content.push({ type: 'Section', props: { id: 'test-section', styleFields: { padding: '12px' }, children: [grid] } });
      await save('navbar', 'publish', nesting);
      await publicPage.reload();
      const firstBox = await publicPage.getByText('Nested first test', { exact: true }).boundingBox();
      const secondBox = await publicPage.getByText('Nested second test', { exact: true }).boundingBox();
      assert(firstBox.x < secondBox.x && Math.abs(firstBox.y - secondBox.y) < 2, 'Nested grid columns did not render side by side.');
      grid.props.children.reverse(); await save('navbar', 'publish', nesting); await publicPage.reload();
      assert((await publicPage.getByText('Nested first test', { exact: true }).boundingBox()).x > (await publicPage.getByText('Nested second test', { exact: true }).boundingBox()).x, 'Reordered nested columns were not rendered.');
      nesting.content.pop(); await save('navbar', 'publish', nesting); await publicPage.reload();
      assert.equal(await publicPage.getByText('Nested first test', { exact: true }).count(), 0);
      await save('navbar', 'reset');
      console.log('Nested layout checks passed: added section/grid/columns/text, side-by-side layout, reordering, deletion, and reset.');
      const beforeFooter = await capture('footer.site-footer');
      const footer = await get('footer');
      await save('footer','publish',footer.defaults);
      assert((await capture('footer.site-footer')).equals(beforeFooter), 'Publishing Footer defaults changed its pixels.');
      await save('footer','reset');
      await editor.goto(`${base}/admin/visual-editor/footer/?locale=en`);
      await editor.getByText('Existing Footer', { exact: true }).last().click();
      await editor.locator('textarea[name="content.tagline"]').fill('Footer draft browser test');
      await editor.getByRole('button', { name: 'Save draft', exact: true }).click();
      await editor.getByRole('status').filter({ hasText: 'Draft saved' }).waitFor();
      await publicPage.reload(); assert(!(await publicPage.locator('footer.site-footer').innerText()).includes('Footer draft browser test'));
      await editor.getByRole('button', { name: 'Publish', exact: true }).click();
      await editor.getByRole('status').filter({ hasText: 'Published to all pages' }).waitFor();
      await publicPage.reload(); assert((await publicPage.locator('footer.site-footer').innerText()).includes('Footer draft browser test'));
      await editor.screenshot({ path: path.join(out,'footer-editor.png'), fullPage: true });
      console.log('Footer browser checks passed: identical default pixels, field editing, private draft, public publish.');
      assert.deepEqual(pageErrors, []);
    } finally {
      for (const id of cleanup) await save(id,'reset');
      await context.request.post(`${base}/api/auth/logout/`);
      if (uploadedFilename && /^visual-[a-f0-9-]{36}\.png$/.test(uploadedFilename) && fs.existsSync(path.join('public/uploads/visual-editor', uploadedFilename))) fs.unlinkSync(path.join('public/uploads/visual-editor', uploadedFilename));
      await browser.close();
    }
  })().catch(error => { console.error(error); process.exitCode = 1; });
}
