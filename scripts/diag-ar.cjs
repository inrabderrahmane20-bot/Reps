/* Types an Arabic query into the AR locale overlay and reports the grouped
   results, proving the Arabic vocabulary bridge works in the real UI.
   Usage: node scripts/diag-ar.cjs [query] */
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
const query = process.argv[2] || 'سباك';

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'ar-MA',
  });
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem('medina.languageSelected', '1');
    } catch {}
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/ar`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('header', { timeout: 60000 });
  await page.waitForTimeout(1800);

  const box = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      (b.getAttribute('aria-label') || '').match(/فتح البحث|Ouvrir la recherche/)
    );
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (!box) {
    console.log('pill not found');
    await browser.close();
    return;
  }
  for (let a = 0; a < 4; a++) {
    await page.mouse.click(box.x, box.y);
    await page.waitForTimeout(400);
    const open = await page.evaluate(() => !!document.getElementById('reps-fs-listbox'));
    if (open) break;
  }
  await page.keyboard.type(query, { delay: 60 });
  await page.waitForTimeout(2000);
  const out = await page.evaluate(() => {
    const list = document.getElementById('reps-fs-listbox');
    if (!list) return { open: false };
    const groups = Array.from(list.querySelectorAll('[role="group"]')).map((g) => ({
      label: (g.getAttribute('aria-label') || g.textContent || '').slice(0, 40),
      options: g.querySelectorAll('[role="option"]').length,
    }));
    const marks = Array.from(list.querySelectorAll('mark')).map((m) => m.textContent);
    return {
      open: true,
      dir: getComputedStyle(list).direction,
      options: list.querySelectorAll('[role="option"]').length,
      groups,
      marks: marks.slice(0, 8),
      first: (list.querySelector('[role="option"]')?.textContent || '').slice(0, 60),
    };
  });
  console.log(`query="${query}"`, JSON.stringify(out, null, 1));
  await browser.close();
})();
