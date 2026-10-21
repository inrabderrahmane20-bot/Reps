/* Diagnostic: find elements that overflow the viewport horizontally. */
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
    const context = await browser.newContext({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto(`${BASE}/fr`, { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(800);
    const info = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const out = [];
      document.querySelectorAll('*').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return;
        if (r.right > vw + 1 || r.left < -1) {
          const cs = getComputedStyle(el);
          out.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className || '').toString().slice(0, 140),
            x: Math.round(r.x),
            right: Math.round(r.right),
            w: Math.round(r.width),
            pos: cs.position,
            text: (el.textContent || '').trim().slice(0, 40),
          });
        }
      });
      return { vw, scrollW: document.documentElement.scrollWidth, out: out.slice(0, 60) };
    });
    console.log(`\n=== width ${width} (scrollW=${info.scrollW}, vw=${info.vw}) ===`);
    info.out.forEach((o) =>
      console.log(` ${o.tag} x=${o.x} right=${o.right} w=${o.w} pos=${o.pos} "${o.text}" :: ${o.cls}`)
    );
    await context.close();
  }
  await browser.close();
})();
