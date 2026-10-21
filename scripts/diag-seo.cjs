/* Prints the SEO head of a set of routes. */
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

const ROUTES = process.argv.slice(2);

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  for (const route of ROUTES) {
    try {
      await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    } catch (err) {
      console.log(route, 'NAV FAILED', String(err).slice(0, 120));
      continue;
    }
    await page.waitForTimeout(1500);
    const info = await page.evaluate(() => {
      const q = (sel) => document.querySelector(sel)?.getAttribute('content') ?? null;
      const canonical = document.querySelector('link[rel=canonical]')?.getAttribute('href') ?? null;
      const alts = [...document.querySelectorAll('link[rel=alternate]')].map(
        (l) => `${l.getAttribute('hreflang')}=${l.getAttribute('href')}`
      );
      return {
        title: document.title,
        desc: (q('meta[name=description]') || '').slice(0, 80),
        canonical,
        robots: q('meta[name=robots]'),
        ogLocale: q('meta[property="og:locale"]'),
        h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()).slice(0, 2),
        alts: alts.length,
      };
    });
    console.log(route, JSON.stringify(info));
  }

  await browser.close();
})();
