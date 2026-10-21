/* Diagnostic: why is the mobile tab bar 387px wide? */
const path = require('path');
const PW = path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright-core');
const { chromium } = require(PW);
const CHROME =
  process.env.CHROME_PATH ||
  path.join(process.env.USERPROFILE, 'AppData', 'Local', 'ms-playwright', 'chromium-1223', 'chrome-win64', 'chrome.exe');
const BASE = process.env.BASE_URL || 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 320, height: 800 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto(`${BASE}/fr`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('header', { timeout: 60000 });
  await page.waitForTimeout(2500);
  const info = await page.evaluate(() => {
    const nav = document.querySelector('nav.fixed');
    if (!nav) return { err: 'no nav' };
    const cs = getComputedStyle(nav);
    const chain = [];
    let p = nav.parentElement;
    while (p) {
      const pcs = getComputedStyle(p);
      chain.push({
        tag: p.tagName.toLowerCase(),
        cls: (p.className || '').toString().slice(0, 90),
        w: p.getBoundingClientRect().width,
        transform: pcs.transform,
        filter: pcs.filter,
        backdropFilter: pcs.backdropFilter,
        willChange: pcs.willChange,
        contain: pcs.contain,
        perspective: pcs.perspective,
        zoom: pcs.zoom,
      });
      p = p.parentElement;
    }
    const kids = Array.from(nav.children).map((k) => {
      const r = k.getBoundingClientRect();
      const kcs = getComputedStyle(k);
      return {
        text: (k.textContent || '').trim(),
        w: Math.round(r.width),
        minW: kcs.minWidth,
        wcss: kcs.width,
        flex: kcs.flex,
        label: (k.querySelector('span:last-child') || {}).textContent,
      };
    });
    return {
      navW: Math.round(nav.getBoundingClientRect().width),
      width: cs.width,
      minWidth: cs.minWidth,
      maxWidth: cs.maxWidth,
      inset: `${cs.left}/${cs.right}`,
      position: cs.position,
      chain,
      kids,
    };
  });
  console.log(JSON.stringify(info, null, 1));
  await context.close();
  await browser.close();
})();
