/* Deliverable screenshots: homepage, navbar, floating search, Solde page and
   sponsored placements — FR + AR, desktop + mobile.
   Usage: node scripts/shots.cjs [outDir]                                  */
const path = require('path');
const fs = require('fs');

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
const OUT = path.resolve(process.argv[2] || 'screenshots');

const VIEWPORTS = [
  { name: 'mobile-375', width: 375, height: 812, mobile: true },
  { name: 'mobile-390', width: 390, height: 844, mobile: true },
  { name: 'tablet-768', width: 768, height: 1024, mobile: false },
  { name: 'laptop-1024', width: 1024, height: 768, mobile: false },
  { name: 'laptop-1440', width: 1440, height: 900, mobile: false },
  { name: 'wide-1600', width: 1600, height: 1000, mobile: false },
];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Navigate and wait until the app has really rendered. `domcontentloaded` is
 * not enough: when the dev server is mid-compile (or crashed) the response is a
 * blank shell, and screenshotting that silently produces a useless image.
 * So we wait for a non-empty <body> with real text, then assert it.
 */
async function gotoReady(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page
    .waitForFunction(
      () => {
        const body = document.body;
        if (!body) return false;
        const text = (body.innerText || '').trim();
        return text.length > 200 && !!document.querySelector('main, header');
      },
      { timeout: 45000 }
    )
    .catch(() => {});
  await wait(1800);
  const info = await page.evaluate(() => ({
    text: (document.body?.innerText || '').trim().length,
    header: !!document.querySelector('header'),
    main: !!document.querySelector('main'),
    status: null,
  }));
  if (info.text < 200 || !info.header) {
    throw new Error(
      `page did not render: url=${url} textLen=${info.text} header=${info.header} main=${info.main}`
    );
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
      locale: 'fr-FR',
    });
    // Returning visitor: no first-visit language modal in the shots.
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem('medina.languageSelected', '1');
      } catch {}
    });

    const page = await context.newPage();

    for (const locale of ['fr', 'ar']) {
      /* ---- homepage + navbar ---------------------------------------- */
      await gotoReady(page, `${BASE}/${locale}`);
      await page.screenshot({ path: path.join(OUT, `home-${locale}-${vp.name}.png`), fullPage: false });
      await page.screenshot({
        path: path.join(OUT, `navbar-${locale}-${vp.name}.png`),
        clip: { x: 0, y: 0, width: vp.width, height: Math.min(150, vp.height) },
      });

      /* ---- floating search overlay ---------------------------------- */
      const box = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find((b) =>
          (b.getAttribute('aria-label') || '').match(/Ouvrir la recherche|فتح البحث/)
        );
        if (!btn) return null;
        const r = btn.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + Math.min(8, r.height / 2) };
      });
      if (box) {
        await page.mouse.click(box.x, box.y);
        await wait(700);
        await page.keyboard.type(locale === 'ar' ? 'سباك' : 'plomb', { delay: 40 });
        await wait(1400);
        const searchState = await page.evaluate(() => ({
          panel: !!document.getElementById('reps-fs-listbox'),
          options: document.querySelectorAll('#reps-fs-listbox [role="option"]').length,
          value: document.querySelector('input[role="combobox"]')?.value ?? '',
        }));
        if (!searchState.panel || searchState.options === 0) {
          throw new Error(
            `search overlay did not produce results at ${locale} ${vp.name}: ${JSON.stringify(searchState)}`
          );
        }
        await page.screenshot({
          path: path.join(OUT, `search-${locale}-${vp.name}.png`),
          fullPage: false,
        });
        await page.keyboard.press('Escape');
        await wait(500);
      } else {
        throw new Error(`search pill not found at ${locale} ${vp.name}`);
      }

      /* ---- sponsored placements (services page) --------------------- */
      await gotoReady(page, `${BASE}/${locale}/services`);
      await page.screenshot({
        path: path.join(OUT, `sponsored-${locale}-${vp.name}.png`),
        fullPage: false,
      });

      /* ---- Solde / Promotions page ---------------------------------- */
      await gotoReady(page, `${BASE}/${locale}/promotions`);
      await page.screenshot({
        path: path.join(OUT, `promotions-${locale}-${vp.name}.png`),
        fullPage: false,
      });

      /* ---- mobile filter bottom sheet ------------------------------- */
      if (vp.mobile) {
        const opened = await page.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find((b) =>
            /^(Filtres|عوامل التصفية|Filters)$/.test((b.textContent || '').trim())
          );
          if (!btn) return false;
          btn.click();
          return true;
        });
        if (opened) {
          await wait(700);
          await page.screenshot({
            path: path.join(OUT, `promo-filters-${locale}-${vp.name}.png`),
            fullPage: false,
          });
        }
      }
    }

    await context.close();
    console.log('captured', vp.name);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
