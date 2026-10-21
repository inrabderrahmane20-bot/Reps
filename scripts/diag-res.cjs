/* Finds resources whose HTTP status is >= 400 using the Resource Timing API. */
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
const target = process.argv[2] || 'fr';

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto(`${BASE}/${target}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(4000);
  const bad = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .filter((e) => e.responseStatus >= 400)
      .map((e) => `${e.responseStatus} ${e.name}`)
  );
  console.log(bad.length ? bad.join('\n') : 'no 4xx/5xx resources');
  await browser.close();
})();
