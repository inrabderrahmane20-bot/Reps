/* Diagnostic: descend the DOM tree to find what widens the document. */
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
      const chain = [];
      let node = document.body;
      while (node) {
        const r = node.getBoundingClientRect();
        chain.push({
          tag: node.tagName.toLowerCase(),
          cls: (node.className || '').toString().slice(0, 150),
          x: Math.round(r.x),
          right: Math.round(r.right),
          w: Math.round(r.width),
          sw: node.scrollWidth,
          cw: node.clientWidth,
          ox: getComputedStyle(node).overflowX,
        });
        // descend into the child that extends furthest right
        let best = null;
        let bestRight = r.right;
        node.querySelectorAll(':scope > *').forEach((c) => {
          const cr = c.getBoundingClientRect();
          if (cr.right > bestRight) {
            bestRight = cr.right;
            best = c;
          }
        });
        if (!best || bestRight <= vw + 0.5) break;
        node = best;
      }
      return { vw, scrollW: document.documentElement.scrollWidth, chain };
    });
    console.log(`\n=== width ${width} (scrollW=${info.scrollW}, vw=${info.vw}) ===`);
    info.chain.forEach((c, i) =>
      console.log(
        `${'  '.repeat(i)}${c.tag} x=${c.x} right=${c.right} w=${c.w} sw=${c.sw} cw=${c.cw} ox=${c.ox}\n${'  '.repeat(i)}   :: ${c.cls}`
      )
    );
    await context.close();
  }
  await browser.close();
})();
