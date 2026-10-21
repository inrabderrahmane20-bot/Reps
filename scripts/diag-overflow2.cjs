/* Diagnostic: find the elements that actually widen the document (no clipping ancestor). */
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
      const vw = document.documentElement.clientWidth;
      const clipped = (el) => {
        let p = el.parentElement;
        while (p) {
          const cs = getComputedStyle(p);
          if (/hidden|auto|scroll|clip/.test(cs.overflowX)) return true;
          p = p.parentElement;
        }
        return false;
      };
      const out = [];
      document.querySelectorAll('body *').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0) return;
        if (r.right > vw + 1 && !clipped(el)) {
          out.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className || '').toString().slice(0, 160),
            x: Math.round(r.x),
            right: Math.round(r.right),
            w: Math.round(r.width),
            text: (el.textContent || '').trim().slice(0, 40),
          });
        }
      });
      return { vw, scrollW: document.documentElement.scrollWidth, out };
    });
    console.log(`\n=== width ${width} (scrollW=${info.scrollW}, vw=${info.vw}) ===`);
    info.out.slice(0, 25).forEach((o) =>
      console.log(` ${o.tag} x=${o.x} right=${o.right} w=${o.w} "${o.text}" :: ${o.cls}`)
    );
    await context.close();
  }
  await browser.close();
})();
