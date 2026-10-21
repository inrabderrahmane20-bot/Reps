/* Lists failing network requests on a page. Usage: node scripts/diag-404.cjs <path> */
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
const target = process.argv[2] || 'fr/promotions';

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const bad = [];
  page.on('response', (r) => {
    if (r.status() >= 400) bad.push(`${r.status()} ${r.url().slice(0, 160)}`);
  });
  page.on('requestfailed', (r) => bad.push(`FAIL ${r.url().slice(0, 160)}`));
  await page.goto(`${BASE}/${target}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(3000);
  console.log(bad.length ? bad.join('\n') : 'no failing requests');
  await browser.close();
})();
