/* Traces exactly which element receives each pointer/mouse event during the
   pill click, to locate the click-through. */
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
const locale = process.argv[2] || 'fr';

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    locale: 'fr-FR',
  });
  const page = await context.newPage();

  await page.goto(`${BASE}/${locale}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('header', { timeout: 60000 });
  await page.waitForTimeout(1500);

  await page.evaluate(() => {
    window.__trace = [];
    const describe = (el) =>
      el
        ? `${el.tagName}${el.id ? '#' + el.id : ''}.${(el.className || '').toString().slice(0, 60)}`
        : 'null';
    for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'touchstart', 'touchend']) {
      document.addEventListener(
        type,
        (e) => {
          window.__trace.push(`${type} -> ${describe(e.target)}`);
        },
        true
      );
    }
  });

  const box = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      (b.getAttribute('aria-label') || '').match(/Ouvrir la recherche|فتح البحث/)
    );
    const r = btn.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });

  await page.mouse.click(box.x, box.y);
  await page.waitForTimeout(900);

  const out = await page.evaluate(() => ({
    trace: window.__trace,
    panel: !!document.getElementById('reps-fs-listbox'),
    focused: document.activeElement?.tagName,
  }));
  console.log(out.trace.join('\n'));
  console.log('--- panel:', out.panel, 'focused:', out.focused);

  await browser.close();
})();
