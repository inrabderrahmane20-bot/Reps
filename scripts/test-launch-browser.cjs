const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm/node_modules/playwright-core'));
const base = process.env.BASE_URL || 'http://localhost:3100';
const output = path.resolve('.local-data/launch-browser');
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1223/chrome-win64/chrome.exe'), headless: true });
  let checks = 0;
  const issues = [];
  try {
    for (const locale of ['fr', 'en', 'ar']) {
      const messages = require('../src/messages/' + locale + '.json');
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await context.addInitScript(() => {
        localStorage.setItem('medina.languageSelected', '1');
        Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition: (_success, fail) => fail({ code: 1 }) } });
      });
      const page = await context.newPage();
      page.on('pageerror', error => issues.push(locale + ': ' + error.message));
      page.on('console', message => { if (/MISSING_MESSAGE|INVALID_MESSAGE/.test(message.text())) issues.push(locale + ': ' + message.text()); });
      for (const route of ['', '/services', '/communities', '/activities', '/news', '/sell', '/meetings', '/login', '/register', '/contact', '/legal', '/privacy', '/verification']) {
        const response = await page.goto(base + '/' + locale + route + '/', { waitUntil: 'networkidle', timeout: 90000 });
        assert(response.ok(), locale + route + ': HTTP ' + response.status()); checks++;
        assert.equal(await page.locator('html').getAttribute('dir'), locale === 'ar' ? 'rtl' : 'ltr'); checks++;
        const overflow = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: innerWidth }));
        assert(overflow.scroll <= overflow.width + 1, locale + route + ': horizontal overflow ' + JSON.stringify(overflow)); checks++;
        for (const href of ['contact', 'legal', 'privacy', 'verification']) {
          assert(await page.locator('footer a[href="/' + locale + '/' + href + '"]').isVisible(), 'Missing visible footer link ' + locale + route + ':' + href); checks++;
        }
        if (route === '/login') {
          assert.equal(await page.getByLabel(messages.auth.emailLabel, { exact: true }).inputValue(), ''); checks++;
          assert.equal(await page.getByLabel(messages.auth.passwordLabel, { exact: true }).inputValue(), ''); checks++;
        }
        if (!route) {
          assert.equal(await page.locator('.home-hero-meta li').count(), 1, 'Empty marketplace should only show category count'); checks++;
          assert.equal(await page.locator('.home-offer-banner').count(), 0); checks++;
          assert.equal(await page.locator('body').getByText('ENTIKITER', { exact: true }).count(), 0); checks++;
          await page.screenshot({ path: path.join(output, locale + '-mobile.png'), fullPage: true });
          await page.setViewportSize({ width: 1440, height: 1000 });
          const desktop = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
          assert(desktop, 'Desktop overflow ' + locale); checks++;
          await page.screenshot({ path: path.join(output, locale + '-desktop.png'), fullPage: true });
          await page.setViewportSize({ width: 390, height: 844 });
        }
      }
      await page.route('**/leaflet.js', route => route.abort());
      await page.goto(base + '/' + locale + '/map/', { waitUntil: 'networkidle' });
      for (const key of ['available', 'availableLater', 'offline']) { assert(await page.getByText(messages.common[key], { exact: true }).isVisible()); checks++; }
      await page.getByRole('button', { name: messages.zones.shareLocation }).click();
      assert(await page.getByText(messages.zones.denied, { exact: true }).isVisible()); checks++;
      // A failing feed must expose retry, not masquerade as an empty marketplace.
      await page.route('**/api/providers?*', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Test outage' }) }));
      await page.goto(base + '/' + locale + '/', { waitUntil: 'networkidle' });
      await page.getByRole('alert').filter({ hasText: messages.home.loadError }).waitFor(); checks++;
      assert(await page.getByRole('button', { name: messages.common.tryAgain, exact: true }).isVisible()); checks++;
      await context.close();
    }
    assert.deepEqual(issues, [], 'Browser errors / missing translations');
    console.log('PASS: ' + checks + ' browser checks. Screenshots: ' + output);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
