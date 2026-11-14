// Run against a local dev server. Editor saves/uploads are intercepted, preserving existing documents.
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm/node_modules/playwright-core'));
const base = process.env.BASE_URL || 'http://localhost:3002';

(async () => {
  const browser = await chromium.launch({ executablePath: path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1223/chrome-win64/chrome.exe'), headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1100 }, reducedMotion: 'reduce' });
  await context.addInitScript(() => {
    localStorage.setItem('medina.languageSelected', '1');
    localStorage.setItem('medina.selectedLanguage', 'en');
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, init) => String(input).includes('/api/insights')
      ? Promise.resolve(new Response('{"ok":true}', { headers: { 'Content-Type': 'application/json' } }))
      : originalFetch(input, init);
  });
  const saved = [];
  await context.route(/\/api\/admin\/visual-editor\/documents\/(home|services)\//, async route => {
    if (route.request().method() !== 'PUT') return route.continue();
    const body = route.request().postDataJSON();
    saved.push(body);
    await route.fulfill({ json: { document: { id: route.request().url().includes('/home/') ? 'home' : 'services', locale: 'en', revision: body.revision + 1, draft: body.data, published: body.action === 'publish' ? body.data : null } } });
  });
  await context.route('**/api/admin/visual-editor/upload/**', route => route.fulfill({ json: { url: '/images/categories/service-technique.jpg' } }));
  const editor = await context.newPage();
  editor.on('dialog', dialog => dialog.accept());
  const errors = [];
  editor.on('pageerror', error => errors.push(error.message));
  try {
    assert.equal((await context.request.post(`${base}/api/auth/login/`, { data: { email: 'admin@medina.ma', password: 'admin123' } })).status(), 200);
    const beforeHome = await (await context.request.get(`${base}/api/admin/visual-editor/documents/home/?locale=en`)).json();
    await editor.goto(`${base}/admin/visual-editor/home/?locale=en`, { timeout: 120000 });
    await editor.getByRole('button', { name: 'Category images', exact: true }).click();
    await editor.getByLabel('Category', { exact: true }).selectOption('services');
    const frame = editor.frameLocator('iframe');
    const root = frame.locator('.home-discovery-card[data-category-id="services"]');
    await root.waitFor();
    const regular = await frame.locator('.hc-card').first().evaluate(card => ({
      fraction: card.querySelector('.hc-card-media').getBoundingClientRect().width / card.getBoundingClientRect().width,
      fontSize: parseFloat(getComputedStyle(card.querySelector('.hc-card-name')).fontSize),
    }));
    assert(regular.fraction < .36, 'Regular mobile images should use less space');
    assert(regular.fontSize >= 15, 'Mobile labels should be larger');
    await editor.getByLabel('Mobile image size').selectOption('icon');
    await editor.getByLabel('Icon', { exact: true }).selectOption('Wrench');
    await root.locator('.category-mobile-icon svg').waitFor();
    assert.equal(await root.locator('.home-discovery-media').isVisible(), false);
    assert.equal(await frame.locator('.hc-card[data-mobile-size="icon"]').count(), 0, 'Other categories stay regular');

    await editor.locator('.ve-category-appearance input[type=file]').setInputFiles({ name: 'icon.png', mimeType: 'image/png', buffer: Buffer.from([137,80,78,71,13,10,26,10]) });
    await root.locator('.category-mobile-icon img').waitFor();
    assert.equal(await root.locator('.category-mobile-icon img').getAttribute('src'), '/images/categories/service-technique.jpg');
    await editor.getByLabel('Mobile image size').selectOption('regular');
    await root.locator('.home-discovery-media').waitFor();
    assert.equal(await root.locator('.category-mobile-icon').count(), 0);
    await editor.getByLabel('Mobile image size').selectOption('icon');
    await root.locator('.category-mobile-icon img').waitFor();
    await editor.getByRole('button', { name: 'Save draft', exact: true }).click();
    await editor.getByText('Draft saved. The public site is unchanged.', { exact: true }).waitFor();
    assert.equal(saved.at(-1).data.root.props.categoryAppearance[0].mobileSize, 'icon');
    await editor.locator('.ve-publish').click();
    await editor.getByText('Page published in this language.', { exact: true }).waitFor();
    assert.equal(saved.at(-1).action, 'publish');
    await editor.getByRole('button', { name: '960px preview', exact: true }).click();
    await root.locator('.home-discovery-media').waitFor();
    assert.equal(await root.locator('.category-mobile-icon').isVisible(), false, 'Desktop/tablet retains its photo');
    assert.deepEqual(await (await context.request.get(`${base}/api/admin/visual-editor/documents/home/?locale=en`)).json(), beforeHome, 'Test must not publish or overwrite the existing Home document');

    await editor.goto(`${base}/admin/visual-editor/services/?locale=en`);
    await editor.getByRole('button', { name: 'Category images', exact: true }).click();
    const tree = (await (await context.request.get(`${base}/api/categories/tree/`)).json()).categories;
    const technique = tree.find(node => /services/i.test(node.slug)).children.find(node => /technique/i.test(node.slug));
    await editor.getByLabel('Category', { exact: true }).selectOption(technique.id);
    assert.equal(await editor.getByLabel('Mobile image size').inputValue(), 'regular');
    await editor.getByLabel('Mobile image size').selectOption('icon');
    await editor.getByLabel('Icon', { exact: true }).selectOption('Car');
    const serviceChoice = editor.frameLocator('iframe').locator(`.svc-mobile-choice[data-category-id="${technique.id}"]`);
    await serviceChoice.locator('.category-mobile-icon svg').waitFor();
    assert.equal(await serviceChoice.locator('.svc-mobile-photo').isVisible(), false);
    await editor.getByRole('button', { name: 'Reset this category', exact: true }).click();
    await serviceChoice.locator('.svc-mobile-photo').waitFor();
    assert.deepEqual(errors, []);
    console.log('Category editor checks passed: mobile sizing, per-category switching, custom uploads, regular/icon restore, draft/publish payloads, independent Services settings, and desktop photos. Existing documents preserved.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
