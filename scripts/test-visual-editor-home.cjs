// Run against `next start` after a build. Development file watching reloads local JSON saves.
// Refuses to overwrite existing Home/legal documents and restores all test publications.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { chromium } = require(path.join(process.env.APPDATA, 'npm/node_modules/playwright-core'));
const base = process.env.BASE_URL || 'http://localhost:3002';
(async () => {
  const browser = await chromium.launch({ executablePath: path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1223/chrome-win64/chrome.exe'), headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => { localStorage.setItem('medina.languageSelected','1'); localStorage.setItem('medina.selectedLanguage','en'); });
  const page = await context.newPage();
  const editor = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  editor.on('pageerror', error => errors.push(error.message));
  const cleanup = new Set();
  async function get(id, locale = 'en') {
    const response = await context.request.get(`${base}/api/admin/visual-editor/documents/${id}/?locale=${locale}`);
    assert.equal(response.status(), 200, await response.text()); return response.json();
  }
  async function save(id, action, data) {
    const { document } = await get(id);
    const response = await context.request.put(`${base}/api/admin/visual-editor/documents/${id}/?locale=en`, { data: { action, revision: document.revision, data } });
    assert.equal(response.status(), 200, await response.text()); return response.json();
  }
  async function capture(route, selector) {
    await page.goto(`${base}/en${route}/`);
    await page.locator(`${selector} h1`).waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1000);
    await page.locator(`${selector} img`).evaluateAll(images => Promise.all(images.map(img => { img.loading = 'eager'; return Promise.race([img.decode().catch(() => {}), new Promise(resolve => setTimeout(resolve, 15000))]); })));
    await page.waitForTimeout(400);
    return page.locator(selector).screenshot({ animations: 'disabled' });
  }
  try {
    assert.equal((await context.request.post(`${base}/api/auth/login/`, {data:{email:'admin@medina.ma',password:'admin123'}})).status(),200);
    for (const id of ['home','privacy','terms','rules']) {
      const { document, defaults } = await get(id);
      assert(!document.draft && !document.published, `Refusing to overwrite an existing ${id} document.`);
      cleanup.add(id);
      const route = id === 'home' ? '' : `/${id}`;
      const selector = id === 'home' ? '.home-redesign' : 'main';
      await page.setViewportSize({width:1440,height:1000});
      console.log(`Checking ${id} defaults...`);
      const before = await capture(route, selector);
      const originalHeading = await page.locator(`${selector} h1`).textContent();
      const french = (await get(id,'fr')).document;
      await save(id, 'publish', defaults);
      const after = await capture(route, selector);
      fs.writeFileSync(path.join(os.tmpdir(), `${id}-before.png`), before);
      fs.writeFileSync(path.join(os.tmpdir(), `${id}-after.png`), after);
      assert(before.equals(after), `Publishing ${id} defaults changed the desktop screenshot.`);
      await page.setViewportSize({width:390,height:844});
      await save(id,'reset');
      const mobileBefore = await capture(route,selector);
      await save(id,'publish',defaults);
      const mobileAfter = await capture(route,selector);
      assert(mobileBefore.equals(mobileAfter), `Publishing ${id} defaults changed mobile layout.`);
      const custom = structuredClone(defaults);
      custom.content[0].props.content[id === 'home' ? 'heroTitle' : 'title'] = `Edited ${id} heading`;
      await save(id,'draft',custom);
      await page.reload();
      assert.equal(await page.locator(`${selector} h1`).textContent(), originalHeading, 'Draft leaked publicly.');
      await save(id,'publish',custom);
      await page.reload();
      assert.equal(await page.locator(`${selector} h1`).textContent(), `Edited ${id} heading`);
      assert.deepEqual((await get(id,'fr')).document, french, 'English publication changed French.');
      await save(id,'reset');
      await page.reload();
      assert.equal(await page.locator(`${selector} h1`).textContent(), originalHeading);
      await editor.goto(`${base}/admin/visual-editor/${id}/?locale=en`);
      await editor.getByRole('button',{name:'Individual elements',exact:true}).click();
      const inspector = editor.getByRole('complementary',{name:'Individual element inspector'});
      await inspector.getByLabel('Content item').selectOption(id === 'home' ? 'heroTitle' : 'title');
      assert.equal(await inspector.getByLabel('Current value').inputValue(), originalHeading);
      console.log(`${id}: default desktop/mobile pixels, draft isolation, publish, reset, locale isolation and editor fields passed.`);
    }
    assert.deepEqual(errors, []);
  } finally {
    try { for (const id of cleanup) await save(id, 'reset'); }
    finally { await browser.close(); }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
