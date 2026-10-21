/* Reproduces the floating-search acceptance steps with diagnostics. */
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
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 400)));
  page.on('console', (m) => {
    if (m.type() === 'error') console.log('[console.error]', m.text().slice(0, 300));
  });

  await page.goto(`${BASE}/${locale}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('header', { timeout: 60000 });
  await page.waitForTimeout(1500);

  const clicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      (b.getAttribute('aria-label') || '').match(/Ouvrir la recherche|فتح البحث/)
    );
    if (!btn) return 'no pill button';
    return 'found';
  });
  console.log('pill:', JSON.stringify(clicked));
  const box = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      (b.getAttribute('aria-label') || '').match(/Ouvrir la recherche|فتح البحث/)
    );
    const r = btn.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height, top: r.top, bottom: r.bottom };
  });
  console.log('pill box:', JSON.stringify(box));
  await page.mouse.click(box.x, box.y);
  console.log('clicked at', box.x, box.y);
  await page.waitForTimeout(800);

  const state = await page.evaluate(() => {
    const input = document.querySelector('input[role="combobox"]');
    const all = [...document.querySelectorAll('input')].map((i) => ({
      type: i.type,
      role: i.getAttribute('role'),
      hidden: i.offsetParent === null && i.type !== 'search' && i.type !== 'text',
      w: i.getBoundingClientRect().width,
      ph: i.placeholder?.slice(0, 30),
    }));
    return {
      hasCombobox: !!input,
      panel: !!document.getElementById('reps-fs-listbox'),
      focusedTag: document.activeElement?.tagName,
      focusedRole: document.activeElement?.getAttribute?.('role'),
      inputs: all.slice(0, 8),
      dialogs: [...document.querySelectorAll('[role="dialog"]')].length,
    };
  });
  console.log(JSON.stringify(state, null, 1));

  await browser.close();
})();
