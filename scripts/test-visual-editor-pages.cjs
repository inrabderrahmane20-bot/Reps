// Run against `next start` after a build. Isolated browser integration test. Refuses to overwrite existing saved page documents.
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm/node_modules/playwright-core'));
const base = process.env.BASE_URL || 'http://localhost:3002';
(async () => {
  const browser = await chromium.launch({ executablePath: path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1223/chrome-win64/chrome.exe'), headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => { localStorage.setItem('medina.languageSelected','1'); localStorage.setItem('medina.selectedLanguage','en'); });
  const page = await context.newPage();
  const editor = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message)); editor.on('pageerror', error => errors.push(error.message));
  const cleanup = new Set();
  async function get(id) {
    const response = await context.request.get(`${base}/api/admin/visual-editor/documents/${id}/?locale=en`);
    assert.equal(response.status(), 200, await response.text()); return response.json();
  }
  async function save(id, action, data) {
    const { document } = await get(id);
    const response = await context.request.put(`${base}/api/admin/visual-editor/documents/${id}/?locale=en`, { data: { action, revision: document.revision, data } });
    assert.equal(response.status(), 200, await response.text()); return response.json();
  }
  async function capture(route, selector) {
    await page.goto(`${base}/en${route}/`);
    await page.locator(`${selector} img`).first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1000);
    await page.locator(`${selector} img`).evaluateAll(images => Promise.all(images.map(img => { img.loading = 'eager'; return Promise.race([img.decode().catch(() => {}), new Promise(resolve => setTimeout(resolve, 15000))]); })));
    await page.waitForTimeout(400);
    return page.locator(selector).screenshot({ animations: 'disabled' });
  }
  try {
    assert.equal((await context.request.post(`${base}/api/auth/login/`, {data:{email:'admin@medina.ma',password:'admin123'}})).status(),200);
    const { document, defaults } = await get('services');
    assert(!document.draft && !document.published, 'Refusing to overwrite an existing Services document.');
    cleanup.add('services');
    console.log('Checking Services desktop defaults...');
    const before = await capture('/services', '.svc-page');
    await save('services', 'draft', defaults);
    assert(!(await get('services')).document.published);
    await save('services', 'publish', defaults);
    const after = await capture('/services', '.svc-page');
    assert(before.equals(after), 'Publishing Services defaults changed the page screenshot.');
    console.log('Checking Services editor...');
    await editor.goto(`${base}/admin/visual-editor/services/?locale=en`);
    await editor.getByRole('button',{name:'Expand workspace',exact:true}).click();
    await editor.getByRole('button',{name:'Actual-size canvas',exact:true}).click();
    const frame = editor.frameLocator('iframe');
    await frame.locator('.svc-cat-card').first().waitFor();
    await editor.getByRole('button',{name:'Individual elements',exact:true}).click();
    const inspector = editor.getByRole('complementary',{name:'Individual element inspector'});
    await inspector.getByLabel('Component',{exact:true}).selectOption('services-ServicesHero');
    await inspector.getByLabel('Content item').selectOption('heroTitle');
    await inspector.getByLabel('Current value').fill('A custom services heading');
    await inspector.getByRole('button',{name:'Close',exact:true}).click();
    await editor.getByRole('button',{name:'Save draft',exact:true}).click();
    await editor.getByRole('status').filter({hasText:'Draft saved'}).waitFor();
    await page.reload(); assert.notEqual(await page.locator('#services-hero-title').textContent(), 'A custom services heading');
    await editor.getByRole('button',{name:'Publish',exact:true}).click();
    await editor.getByRole('status').filter({hasText:'Page published'}).waitFor();
    await page.reload(); assert.equal(await page.locator('#services-hero-title').textContent(), 'A custom services heading');
    await page.locator('.svc-cat-card').first().click();
    await page.locator('.svc-cat-card[aria-current=true]').waitFor();
    assert(await page.locator('[data-services-category-browser]').isVisible(), 'Live category tree disappeared.');
    await page.locator('form[role=search] input').fill('electrician');
    await page.locator('.svc-search-clear').waitFor();
    await page.locator('form[role=search] button[type=submit]').click();
    await page.waitForTimeout(1500);
    await page.locator('[data-tour-target=services-results]').waitFor();
    await save('services','reset');
    await page.setViewportSize({width:390,height:844});
    const mobileBefore = await capture('/services','.svc-page');
    await save('services','publish', defaults);
    const mobileAfter = await capture('/services','.svc-page');
    assert(mobileBefore.equals(mobileAfter),'Publishing Services defaults changed mobile layout.');
    assert.deepEqual(errors, []);
    console.log('Services browser checks passed: default desktop/mobile pixels, draft isolation, publish, nested individual editing, live search/category tree, reset.');
  } finally {
    try { for (const id of cleanup) await save(id, 'reset'); }
    finally { await browser.close(); }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
