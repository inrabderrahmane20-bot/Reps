/* Reproduces a single verify.cjs context exactly (init script + click) and
   reports what element actually receives the pill click and whether the input
   ends up focused. Usage: node scripts/diag-fail.cjs <locale> <width> <height> <mobile> */
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
const width = parseInt(process.argv[3] || '390', 10);
const height = parseInt(process.argv[4] || '844', 10);
const mobile = (process.argv[5] || 'true') === 'true';

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    viewport: { width, height },
    isMobile: mobile,
    hasTouch: mobile,
    locale: locale === 'ar' ? 'ar-MA' : 'fr-FR',
  });
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem('medina.languageSelected', '1');
      window.localStorage.setItem('medina.selectedLanguage', document.documentElement.lang || 'fr');
    } catch {}
  });
  const page = await context.newPage();

  await page.goto(`${BASE}/${locale}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('header', { timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const modal = document.querySelector('[role="dialog"][aria-modal="true"]');
    if (modal) modal.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await page.waitForTimeout(300);

  const pre = await page.evaluate(() => ({
    modal: !!document.querySelector('[role="dialog"][aria-modal="true"]'),
    lang: document.documentElement.lang,
  }));
  console.log('pre:', JSON.stringify(pre));

  await page.evaluate(() => {
    window.__trace = [];
    const d = (el) =>
      el ? `${el.tagName}${el.id ? '#' + el.id : ''}.${(el.className || '').toString().slice(0, 50)}` : 'null';
    for (const t of ['pointerdown', 'click', 'touchstart']) {
      document.addEventListener(t, (e) => window.__trace.push(`${t} -> ${d(e.target)}`), true);
    }
  });

  const box = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      (b.getAttribute('aria-label') || '').match(/Ouvrir la recherche|فتح البحث/)
    );
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height };
  });
  console.log('pill:', JSON.stringify(box));
  if (!box) {
    await browser.close();
    return;
  }
  await page.mouse.click(box.x, box.y);
  await page.waitForTimeout(900);

  const mid = await page.evaluate(() => ({
    trace: window.__trace,
    panel: !!document.getElementById('reps-fs-listbox'),
    focused: document.activeElement ? `${document.activeElement.tagName}#${document.activeElement.id}` : 'none',
    expanded: document.querySelector('input[role="combobox"]')?.getAttribute('aria-expanded') ?? null,
  }));
  console.log('trace:\n' + mid.trace.join('\n'));
  console.log('mid:', JSON.stringify({ panel: mid.panel, focused: mid.focused, expanded: mid.expanded }));

  if (mid.panel) {
    await page.keyboard.type('plombier', { delay: 40 });
    await page.waitForTimeout(1800);
    const res = await page.evaluate(() => {
      const list = document.getElementById('reps-fs-listbox');
      if (!list) return null;
      return {
        options: list.querySelectorAll('[role="option"]').length,
        value: document.querySelector('input[role="combobox"]')?.value ?? null,
      };
    });
    console.log('results:', JSON.stringify(res));
  }

  await browser.close();
})();
