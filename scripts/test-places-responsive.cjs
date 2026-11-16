// Browser regression audit. No database writes; Google rendering is checked separately.
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm/node_modules/playwright-core'));
const base = process.env.BASE_URL || 'http://localhost:3000';
const catalogue = require('../src/data/place-destinations.json').destinations;

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1223/chrome-win64/chrome.exe'),
    headless: true,
  });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await context.addInitScript(() => {
      localStorage.setItem('medina.languageSelected', '1');
      const fetchOriginal = window.fetch.bind(window);
      window.fetch = (input, init) => String(input).includes('/api/insights')
        ? Promise.resolve(new Response('{"ok":true}', { headers: { 'Content-Type': 'application/json' } }))
        : fetchOriginal(input, init);
    });
    await context.route(/\/api\/insights/, route => route.fulfill({ json: { ok: true } }));
    await context.route(/\/api\/auth\/me/, route => route.fulfill({ json: { user: null } }));
    await context.route(/\/api\/places\/?(?:\?|$)/, route => route.fulfill({ json: { places: [] } }));
    await context.route('https://www.google.com/maps**', route => route.fulfill({ contentType: 'text/html', body: '<html><body>Map transport stub</body></html>' }));
    // Exercise local image fallbacks without depending on third-party image servers.
    await context.route(/https:\/\/[^/]*wikimedia\.org\//, route => route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const waitClosed = () => page.locator('.dv-shell').waitFor({ state: 'detached' });
    const inFrame = async selector => {
      const result = await page.locator(selector).first().evaluate(el => {
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: document.documentElement.clientWidth, height: window.visualViewport.height };
      });
      assert(result.left >= -1 && result.right <= result.width + 1 && result.top >= -1 && result.bottom <= result.height + 1, `${selector} out of frame: ${JSON.stringify(result)}`);
    };
    const noOverflow = async () => {
      const widths = await page.evaluate(() => [document.documentElement.clientWidth, document.documentElement.scrollWidth]);
      assert(widths[1] <= widths[0], `Horizontal overflow ${widths}`);
    };
    const touchSwipe = async (selector, dx, dy = 0) => {
      const box = await page.locator(selector).boundingBox();
      const start = { x: box.x + box.width / 2 - dx / 2, y: box.y + box.height / 2 };
      const cdp = await context.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
      for (let i = 1; i <= 8; i++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x + dx * i / 8, y: start.y + dy * i / 8 }] });
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await cdp.detach();
      await page.waitForTimeout(400);
    };

    for (const locale of ['fr', 'en', 'ar']) {
      await page.goto(`${base}/${locale}/places/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await page.locator('.mobile-navbar-bar a[href*="/login"]').waitFor({ state: 'attached' });
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('.places-grid .place-tile').count(), 75);
      assert.equal(await page.locator('.place-map-select option').count(), 75);
      for (const [width, height] of (process.env.PLACES_INTERACTIONS_ONLY ? [] : [[320,568], [375,812], [390,844], [640,900], [768,1024], [912,768], [1024,768], [1440,900], [1920,1080], [844,390]])) {
        await page.setViewportSize({ width, height });
        await page.waitForTimeout(150);
        await noOverflow();
        await page.locator('.places-grid .place-tile').first().click();
        await page.locator('.dv-shell').waitFor();
        await inFrame('.dv-shell');
        await inFrame('.dv-close');
        await inFrame('.dv-photo-counter');
        assert(await page.locator('.dv-scroll').evaluate(el => el.clientHeight > 40), 'Description must have room to scroll');
        await page.locator('.dv-close').click();
        await waitClosed();
        await page.locator('.chapter-card').nth(1).click();
        await page.locator('.chapter-shell').waitFor();
        await inFrame('.chapter-shell');
        await inFrame('.chapter-close');
        await page.locator('.chapter-reveal').click();
        await page.waitForTimeout(350);
        assert(await page.locator('.chapter-body').evaluate(el => el.clientHeight > 50), 'Chapter catalogue must remain accessible');
        await page.locator('.chapter-grid .place-tile').first().click();
        await page.locator('.dv-back').click();
        await waitClosed();
        await page.locator('.chapter-shell').waitFor();
        assert.equal(await page.locator('.chapter-shell').getAttribute('data-collapsed'), 'true');
        await page.keyboard.press('Escape');
        await page.locator('.chapter-shell').waitFor({ state: 'detached' });
        console.log(`PASS ${locale} ${width}x${height}: page, viewer, chapter, return and close`);
      }

      await page.setViewportSize({ width: 390, height: 844 });
      const select = page.locator('.place-map-select select');
      await select.selectOption('catalogue-0');
      const map = page.locator('iframe.place-map-canvas');
      let url = new URL(await map.getAttribute('src'));
      assert.equal(url.hostname, 'www.google.com');
      assert.equal(url.searchParams.get('q'), `${catalogue[0].lat},${catalogue[0].lng}`);
      assert.equal(url.searchParams.get('hl'), locale);
      assert.equal(url.searchParams.has('key'), false);
      await page.locator('.place-map-selection-preview').click();
      assert.equal(await page.locator('.dv-dest-nav').count(), 0, 'Map source must not browse unrelated places');
      const title = await page.locator('#destination-viewer-title').innerText();
      const before = await page.locator('.dv-photo-counter').innerText();
      await touchSwipe('.dv-media', locale === 'ar' ? 100 : -100);
      assert.notEqual(await page.locator('.dv-photo-counter').innerText(), before, 'Gallery swipe must change image');
      assert.equal(await page.locator('#destination-viewer-title').innerText(), title);
      const touchPhoto = await page.locator('.dv-photo-counter').innerText();
      await page.locator('.dv-media').focus();
      await page.keyboard.press(locale === 'ar' ? 'ArrowLeft' : 'ArrowRight');
      assert.notEqual(await page.locator('.dv-photo-counter').innerText(), touchPhoto);
      assert.equal(await page.locator('#destination-viewer-title').innerText(), title);
      await touchSwipe('.dv-head-copy', locale === 'ar' ? 100 : -100);
      assert.equal(await page.locator('#destination-viewer-title').innerText(), title, 'Map source swipe must not change destination');
      await page.locator('.dv-sheet-toggle').click();
      assert.equal(await page.locator('.dv-panel').getAttribute('data-expanded'), 'true');
      await page.locator('.dv-maps-link').scrollIntoViewIfNeeded();
      await inFrame('.dv-maps-link');
      await page.locator('.dv-close').click();
      await waitClosed();

      await page.locator('.places-grid .place-tile').first().click();
      const first = await page.locator('#destination-viewer-title').innerText();
      await touchSwipe('.dv-head-copy', locale === 'ar' ? 110 : -110);
      assert.notEqual(await page.locator('#destination-viewer-title').innerText(), first, 'List swipe must change destination');
      await touchSwipe('.dv-head-copy', locale === 'ar' ? -110 : 110);
      assert.equal(await page.locator('#destination-viewer-title').innerText(), first);
      assert.equal(await page.locator('.dv-sheet-nav button').first().isDisabled(), true);
      await touchSwipe('.dv-grab', 0, -140);
      assert.equal(await page.locator('.dv-panel').getAttribute('data-expanded'), 'true', 'Sheet drag expands');
      await page.locator('.dv-close').click();
      await waitClosed();

      await page.locator('.chapter-card').first().click();
      await page.locator('.chapter-category-select').selectOption('excursions');
      assert.equal(await page.locator('.chapter-grid .place-tile').count(), catalogue.filter(p => p.category === 'excursions').length);
      assert.equal(await page.locator('.chapter-shell').count(), 1);
      await page.locator('.chapter-close').click();
      await page.locator('.chapter-shell').waitFor({ state: 'detached' });
      await page.locator('.places-city select').selectOption('Fès');
      const count = await page.locator('.places-grid .place-tile').count();
      assert(count > 0 && count < 75);
      assert.equal(await page.locator('.place-map-select option').count(), count);
      await page.locator('.places-search input').fill('no-match-123456');
      assert.equal(await map.count(), 0);
      assert.equal(await page.locator('.places-grid .place-tile').count(), 0);
      await page.locator('.places-reset').click();
      const unmapped = catalogue.findIndex(p => !Number.isFinite(p.lat));
      await select.selectOption(`catalogue-${unmapped}`);
      url = new URL(await map.getAttribute('src'));
      assert(url.searchParams.get('q').includes(catalogue[unmapped].name));
      assert.equal(await page.locator('.places-grid .place-tile').count(), 75);
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.locator('.places-grid .place-tile').first().click();
      const keyboardTitle = await page.locator('#destination-viewer-title').innerText();
      const photoBefore = await page.locator('.dv-photo-counter').innerText();
      await page.locator('.dv-photo-next').focus();
      await page.keyboard.press(locale === 'ar' ? 'ArrowLeft' : 'ArrowRight');
      assert.notEqual(await page.locator('.dv-photo-counter').innerText(), photoBefore);
      assert.equal(await page.locator('#destination-viewer-title').innerText(), keyboardTitle);
      await page.locator('.dv-close').focus();
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('Tab');
        assert(await page.evaluate(() => !!document.activeElement.closest('.dv-shell')), 'Focus must stay in viewer');
      }
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('Shift+Tab');
        assert(await page.evaluate(() => !!document.activeElement.closest('.dv-shell')), 'Reverse focus must stay in viewer');
      }
      await page.mouse.click(3, 3);
      await waitClosed();
      console.log(`PASS ${locale}: Google URLs, map/list sources, touch gallery, list swipes, sheet drag, category/city/search filters, unmapped search`);
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
