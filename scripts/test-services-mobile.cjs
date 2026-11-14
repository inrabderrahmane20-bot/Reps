// Mobile navigation and desktop isolation. API responses are intercepted; no test data is saved.
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm/node_modules/playwright-core'));
const base = process.env.BASE_URL || 'http://localhost:3002';

(async () => {
  const browser = await chromium.launch({
    executablePath: path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1223/chrome-win64/chrome.exe'),
    headless: true,
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await context.addInitScript(() => {
    localStorage.setItem('medina.languageSelected', '1');
    localStorage.setItem('medina.selectedLanguage', 'en');
    // Keep pagehide/keepalive analytics away from the local database too.
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, init) => String(input).includes('/api/insights')
      ? Promise.resolve(new Response('{"ok":true}', { headers: { 'Content-Type': 'application/json' } }))
      : originalFetch(input, init);
  });
  const requests = [];
  await context.route(/\/api\/insights\/?$/, route => route.fulfill({ json: { ok: true } }));
  await context.route('**/api/categories/popular/**', route => route.fulfill({ json: { counts: {} } }));
  await context.route(/\/api\/providers\/?(?:\?|$)/, route => {
    const url = new URL(route.request().url());
    if (url.searchParams.has('sponsored')) return route.fulfill({ json: { total: 0, providers: [] } });
    requests.push(url.searchParams);
    return route.fulfill({ json: { total: 1, providers: [{
      id: 'mobile-qa', firstName: 'A long professional', lastName: 'name for mobile',
      avatar: '', rating: 4.5, reviewCount: 8, providerStatus: 'approved',
      provider: { category: 'Electrician', title: 'Home repairs', availability: 'available' },
    }] } });
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const noOverflow = async () => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Horizontal overflow');
  try {
    const tree = (await (await context.request.get(`${base}/api/categories/tree/`)).json()).categories;
    const roots = tree.find(node => /services/i.test(node.slug)).children;
    const root = roots.find(node => /technique/i.test(node.slug));
    const trade = root.children[0];
    const leaf = trade.children[0].children.find(node => /maison/i.test(node.slug));

    for (const locale of ['en', 'fr', 'ar']) {
      for (const width of [320, 390, 639]) {
        console.log(`Checking mobile ${locale}/${width}`);
        await page.setViewportSize({ width, height: 844 });
        // The category usage request is made after hydration; wait before clicking SSR links.
        await Promise.all([
          page.waitForResponse(response => response.url().includes('/api/categories/popular/')),
          page.goto(`${base}/${locale}/services/`),
        ]);
        await page.locator('.svc-mobile-choice').first().waitFor();
        assert.equal(await page.locator('.svc-browser-panel').isVisible(), false);
        assert.equal(await page.locator('.svc-provider-filters').isVisible(), false);
        assert.equal(await page.locator('.svc-mobile-choice').count(), Math.min(6, roots.length));
        await noOverflow();
        await page.locator(`.svc-mobile-choice[data-category-id="${root.id}"]`).click();
        assert.equal(await page.locator('.svc-mobile-choice').count(), Math.min(6, root.children.length));
        if (root.children.length > 6) {
          await page.locator('.svc-mobile-more').click();
          assert.equal(await page.locator('.svc-mobile-choice').count(), root.children.length);
          await page.locator('.svc-mobile-more').click();
          assert.equal(await page.locator('.svc-mobile-choice').count(), 6);
        }
        await page.locator(`.svc-mobile-choice[data-category-id="${trade.id}"]`).click();
        await page.locator(`.svc-mobile-choice[data-category-id="${leaf.id}"]`).click();
        assert.equal(await page.locator('.svc-mobile-choice').count(), 0);
        await page.locator('.svc-mobile-back').first().click();
        assert.equal(await page.locator('#svc-mobile-heading').textContent(), trade.labels[locale] || trade.labels.fr);
        await page.locator(`.svc-mobile-choice[data-category-id="${leaf.id}"]`).click();
        await page.locator('.svc-mobile-apply').click();
        await page.locator('.svc-results-shell > article').waitFor();
        assert.equal(requests.at(-1).get('catId'), leaf.id);
        assert.equal(await page.locator('.svc-mobile-browser').isVisible(), false);
        assert.equal(await page.locator('.svc-filter-fields').isVisible(), false);
        await page.locator('.svc-mobile-filter-toggle').click();
        const fields = page.locator('.svc-filter-fields select');
        await fields.nth(0).selectOption('available');
        await page.waitForFunction(() => document.querySelector('.svc-mobile-filter-toggle').textContent.includes('(1)'));
        await Promise.all([
          page.waitForResponse(response => response.url().includes('minRating=4')),
          fields.nth(1).selectOption('4'),
        ]);
        assert.equal(requests.at(-1).get('availability'), 'available');
        assert.equal(requests.at(-1).get('catId'), leaf.id);
        await page.locator('.svc-filter-fields button').click();
        await page.locator('.svc-mobile-filter-toggle').click();
        assert.equal(await page.locator('.svc-filter-fields').isVisible(), false);
        await noOverflow();
        await page.locator('.svc-mobile-results-start button').click();
        await page.locator('.svc-mobile-browser').waitFor();
        await page.locator('.svc-search input').fill('electrician');
        await page.locator('.svc-search-btn').click();
        await page.locator('.svc-results-shell > article').waitFor();
        assert.equal(requests.at(-1).get('q'), 'electrician');
        await noOverflow();
      }
    }
    await page.goto(`${base}/en/services/?catId=${leaf.id}`);
    await page.locator('.svc-results-shell > article').waitFor();
    await page.locator('.svc-mobile-results-start button').click();
    assert.equal(await page.locator('#svc-mobile-heading').textContent(), leaf.labels.en || leaf.labels.fr);
    for (const width of [640, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${base}/en/services/`);
      await page.locator('.svc-browser-panel').waitFor();
      assert.equal(await page.locator('.svc-mobile-browser').isVisible(), false);
      assert.equal(await page.locator('.svc-mobile-filter-toggle').isVisible(), false);
      assert.equal(await page.locator('.svc-filter-fields').isVisible(), true);
      await noOverflow();
    }
    assert.deepEqual(errors, []);
    console.log('Mobile checks passed: EN/FR/AR at 320/390/639px, progressive choices, show more/less, back, provider queries, filters/reset, search, deep links, no overflow, and desktop/tablet isolation.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
