/* Diagnostic: find elements whose content overflows while overflow-x is visible. */
const path = require('path');
const PW = path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright-core');
const { chromium } = require(PW);
const CHROME =
  process.env.CHROME_PATH ||
  path.join(process.env.USERPROFILE, 'AppData', 'Local', 'ms-playwright', 'chromium-1223', 'chrome-win64', 'chrome.exe');
const BASE = process.env.BASE_URL || 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const width of [320, 375]) {
    const context = await browser.newContext({ viewport: { width, height: 800 }, isMobile: false, hasTouch: false });
    const page = await context.newPage();
    await page.goto(`${BASE}/fr`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForSelector('header', { timeout: 60000 });
    await page.waitForTimeout(2500);
    const info = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('body *').forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.overflowX !== 'visible') return;
        if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
          const r = el.getBoundingClientRect();
          out.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className || '').toString().slice(0, 120),
            sw: el.scrollWidth,
            cw: el.clientWidth,
            x: Math.round(r.x),
            right: Math.round(r.right),
            pos: cs.position,
            text: (el.textContent || '').trim().slice(0, 30),
          });        }
      });
      return out;
    });
    console.log(`\n=== width ${width} ===`);
    info.slice(0, 30).forEach((o) =>
      console.log(` ${o.tag} sw=${o.sw} cw=${o.cw} x=${o.x} right=${o.right} pos=${o.pos} "${o.text}" :: ${o.cls}`)
    );
    await context.close();
  }
  await browser.close();
})();
