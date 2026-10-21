/* Diagnostic: measure the layout viewport vs. visual viewport. */
const path = require('path');
const PW = path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright-core');
const { chromium } = require(PW);
const CHROME =
  process.env.CHROME_PATH ||
  path.join(process.env.USERPROFILE, 'AppData', 'Local', 'ms-playwright', 'chromium-1223', 'chrome-win64', 'chrome.exe');
const BASE = process.env.BASE_URL || 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const mobile of [true, false]) {
    const context = await browser.newContext({ viewport: { width: 320, height: 800 }, isMobile: mobile, hasTouch: mobile });
    const page = await context.newPage();
    await page.goto(`${BASE}/fr`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForSelector('header', { timeout: 60000 });
    await page.waitForTimeout(2000);
    const info = await page.evaluate(() => {
      const vv = window.visualViewport;
      const nav = document.querySelector('nav.fixed');
      return {
        innerWidth: window.innerWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        visualViewport: vv ? { width: vv.width, scale: vv.scale } : null,
        screenWidth: screen.width,
        metaViewport: document.querySelector('meta[name="viewport"]')?.getAttribute('content'),
        tabbarW: nav ? Math.round(nav.getBoundingClientRect().width) : null,
      };
    });
    console.log(`isMobile=${mobile}`, JSON.stringify(info));
    await context.close();
  }
  await browser.close();
})();
