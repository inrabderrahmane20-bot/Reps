/* Prints every request/response + console error for a page. */
const path = require('path');

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
const target = process.argv[2] || 'ar/promotions';
const width = Number(process.argv[3] || 375);

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    viewport: { width, height: 812 },
    isMobile: width < 768,
    hasTouch: width < 768,
  });
  const page = await context.newPage();
  page.on('console', (m) => console.log(`[console.${m.type()}] ${m.text().slice(0, 200)}`));
  page.on('pageerror', (e) => console.log('[pageerror] ' + String(e).slice(0, 300)));
  page.on('response', (r) => console.log(`[resp ${r.status()}] ${r.url().slice(0, 160)}`));
  page.on('requestfailed', (r) => console.log(`[failed] ${r.failure()?.errorText} ${r.url().slice(0, 160)}`));
  await page.goto(`${BASE}/${target}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(4000);
  await browser.close();
})();
