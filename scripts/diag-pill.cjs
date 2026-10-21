/* Diagnostic: floating-search pill geometry across viewports. */
const path = require('path');
const PW = path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright-core');
const { chromium } = require(PW);
const CHROME =
  process.env.CHROME_PATH ||
  path.join(process.env.USERPROFILE, 'AppData', 'Local', 'ms-playwright', 'chromium-1223', 'chrome-win64', 'chrome.exe');
const BASE = process.env.BASE_URL || 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const width of [320, 375, 390, 430, 768, 1024, 1440, 1600]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width < 768, hasTouch: width < 768 });
    const page = await context.newPage();
    await page.goto(`${BASE}/fr`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForSelector('header', { timeout: 60000 });
    await page.waitForTimeout(2200);
    const info = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button')).filter((b) =>
        /Ouvrir la recherche|فتح البحث/.test(b.getAttribute('aria-label') || '')
      );
      const b = btns[0];
      if (!b) return { err: 'no pill' };
      const r = b.getBoundingClientRect();
      const glass = b.closest('.glass');
      const gr = glass ? glass.getBoundingClientRect() : null;
      const shell = glass ? glass.parentElement : null;
      const sr = shell ? shell.getBoundingClientRect() : null;
      return {
        btn: { x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height) },
        glass: gr ? { x: Math.round(gr.x), w: Math.round(gr.width) } : null,
        shell: sr ? { x: Math.round(sr.x), w: Math.round(sr.width) } : null,
        shellInline: shell ? shell.getAttribute('style') : null,
      };
    });
    console.log(`w=${width}`, JSON.stringify(info));
    await context.close();
  }
  await browser.close();
})();
