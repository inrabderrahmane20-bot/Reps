/* Quick visual check of the rebuilt Promotions page (FR + AR, desktop + mobile).
   Usage: node scripts/diag-promos.cjs                                        */
const path = require('path');
const fs = require('fs');

const PW = path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright-core');
const { chromium } = require(PW);

const CHROME =
  process.env.CHROME_PATH ||
  path.join(
    process.env.USERPROFILE,
    'AppData',
    'Local',
    'ms-playwright',
    'chromium-1223',
    'chrome-win64',
    'chrome.exe'
  );

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const OUT = path.resolve('screenshots');

const VIEWPORTS = [
  { name: 'mobile-375', width: 375, height: 812, mobile: true },
  { name: 'desktop-1440', width: 1440, height: 900, mobile: false },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
      locale: 'fr-FR',
    });
    const page = await context.newPage();
    const errors = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text().slice(0, 200));
    });
    page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 200)));
    page.on('response', (r) => {
      if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url().slice(0, 160)}`);
    });

    for (const locale of ['fr', 'ar']) {
      await page.goto(`${BASE}/${locale}/promotions`, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await page.waitForTimeout(2500);
      await page.screenshot({ path: path.join(OUT, `promos-${locale}-${vp.name}.png`) });

      const info = await page.evaluate(() => {
        const doc = document.documentElement;
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          h1: document.querySelector('h1')?.textContent?.trim(),
          cards: document.querySelectorAll('article').length,
          count: document.body.innerText.match(/\d+\s+(offres|عروض|offers?)/)?.[0],
        };
      });
      console.log(vp.name, locale, JSON.stringify(info));
    }

    if (errors.length) console.log('  console errors:', errors.slice(0, 5));
    await context.close();
  }

  await browser.close();
})();
