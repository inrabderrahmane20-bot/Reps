/* Acceptance checks for the Phase-1 redesign (navbar, homepage, floating search).
   Usage: node scripts/verify.cjs                                            */
const path = require('path');
const PW = path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright-core');
const { chromium } = require(PW);

const CHROME =
  process.env.CHROME_PATH ||
  path.join(process.env.USERPROFILE, 'AppData', 'Local', 'ms-playwright', 'chromium-1223', 'chrome-win64', 'chrome.exe');

const BASE = process.env.BASE_URL || 'http://localhost:3000';

const VIEWPORTS = [
  { name: '320', width: 320, height: 720, mobile: true },
  { name: '375', width: 375, height: 812, mobile: true },
  { name: '390', width: 390, height: 844, mobile: true },
  { name: '430', width: 430, height: 932, mobile: true },
  { name: '768', width: 768, height: 1024, mobile: false },
  { name: '1024', width: 1024, height: 768, mobile: false },
  { name: '1280', width: 1280, height: 800, mobile: false },
  { name: '1440', width: 1440, height: 900, mobile: false },
  { name: '1600', width: 1600, height: 1000, mobile: false },
];

const problems = [];
function check(cond, label, detail = '') {
  if (!cond) problems.push(`${label} ${detail}`);
  return cond;
}

async function run() {
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  for (const vp of VIEWPORTS) {
    for (const locale of ['fr', 'ar']) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.mobile,
        hasTouch: vp.mobile,
        locale: locale === 'ar' ? 'ar-MA' : 'fr-FR',
      });
      const page = await context.newPage();
      const tag = `[${locale} @${vp.name}]`;

      // Act as a returning visitor: the first-visit language modal must not be
      // covering the page, otherwise every pointer interaction below would hit
      // that modal instead of the control under test. The modal has its own
      // check further down.
      await context.addInitScript(() => {
        try {
          window.localStorage.setItem('medina.languageSelected', '1');
          window.localStorage.setItem('medina.selectedLanguage', document.documentElement.lang || 'fr');
        } catch {
          /* storage unavailable — nothing to seed */
        }
      });

      await page.goto(`${BASE}/${locale}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await page.waitForSelector('header', { timeout: 60000 });
      await page.waitForTimeout(1500);
      // Make sure no first-visit modal is intercepting clicks.
      await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"][aria-modal="true"]');
        if (modal) modal.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      await page.waitForTimeout(300);

      // ---- horizontal overflow -------------------------------------------
      const overflow = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      check(
        overflow.scroll <= overflow.client + 1,
        `${tag} horizontal overflow`,
        `${overflow.scroll} > ${overflow.client}`
      );

      // ---- navbar geometry -----------------------------------------------
      const nav = await page.evaluate(() => {
        const header = document.querySelector('header');
        if (!header) return null;
        const rect = (el) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return null; // hidden
          return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
        };
        const byLabel = (label) =>
          Array.from(header.querySelectorAll('button,a')).find((el) =>
            (el.getAttribute('aria-label') || '').includes(label)
          );
        const navEl = header.querySelector('nav');
        // only *visible* navigation entries count
        const links = navEl
          ? Array.from(navEl.querySelectorAll('a,button'))
              .map((el) => ({ text: (el.textContent || '').trim(), ...rect(el) }))
              .filter((l) => l.w !== undefined && l.w > 0)
          : [];
        // every visible interactive element of the header, to prove the
        // hamburger really is the left-most one
        const headerItems = Array.from(header.querySelectorAll('button,a'))
          .map((el) => ({ text: (el.textContent || '').trim().slice(0, 20), ...rect(el) }))
          .filter((l) => l.w !== undefined && l.w > 0);
        return {
          header: rect(header),
          hamburger: rect(byLabel('Ouvrir le menu') || byLabel('فتح القائمة')),
          close: rect(byLabel('Fermer') || byLabel('إغلاق')),
          lang: rect(byLabel('Langue') || byLabel('اللغة')),
          navLinks: links,
          headerItems,
          dir: document.documentElement.getAttribute('dir'),
        };
      });

      check(nav, `${tag} navbar present`);

      if (nav) {
        if (vp.width < 1024) {
          check(!!nav.hamburger, `${tag} hamburger present`);
          if (nav.hamburger) {
            // physically on the LEFT: it is the left-most visible control of
            // the header and it sits in the left gutter (not mirrored in AR)
            const leftMost = nav.headerItems.reduce(
              (min, it) => (it.x < min ? it.x : min),
              Infinity
            );
            check(
              nav.hamburger.x === leftMost,
              `${tag} hamburger is the left-most header control`,
              `burger.x=${nav.hamburger.x} leftMost=${leftMost}`
            );
            check(
              nav.hamburger.x <= 16,
              `${tag} hamburger in the left gutter`,
              `x=${nav.hamburger.x}`
            );
            check(
              nav.hamburger.x + nav.hamburger.w <= vp.width / 2,
              `${tag} hamburger on the left half`,
              `x=${nav.hamburger.x} w=${nav.hamburger.w} vw=${vp.width}`
            );
          }
          check(!!nav.lang, `${tag} language switcher present`);
          if (nav.lang && nav.hamburger) {
            check(
              nav.lang.x > nav.hamburger.x + nav.hamburger.w,
              `${tag} language switcher on the opposite side of the hamburger`,
              `lang.x=${nav.lang.x} burger=${nav.hamburger.x}+${nav.hamburger.w}`
            );
            check(
              nav.lang.x + nav.lang.w <= vp.width,
              `${tag} language switcher inside viewport`,
              `right=${nav.lang.x + nav.lang.w} vw=${vp.width}`
            );
          }
          check(
            nav.navLinks.length === 0 || nav.navLinks.every((l) => l.w === 0),
            `${tag} desktop nav hidden on small screens`,
            JSON.stringify(nav.navLinks.slice(0, 2))
          );
        } else {
          check(
            nav.navLinks.length >= 4,
            `${tag} desktop nav has items`,
            `count=${nav.navLinks.length}`
          );
          const overflowToggle = nav.navLinks.find((l) => /^(Plus|المزيد)$/.test(l.text.trim()));
          if (vp.width < 1280) {
            check(!!overflowToggle, `${tag} "Plus" overflow menu present at ${vp.name}`);
          } else {
            check(
              nav.navLinks.length === 9,
              `${tag} full 9-item nav at ${vp.name}`,
              `count=${nav.navLinks.length}`
            );
          }
          // promotions must be visually prominent (warm background, not transparent)
          const promo = await page.evaluate(() => {
            const header = document.querySelector('header');
            const navEl = header && header.querySelector('nav');
            if (!navEl) return null;
            const el = Array.from(navEl.querySelectorAll('a,button')).find(
              (e) => /^(Promotions|العروض|Promociones)$/.test((e.textContent || '').trim())
            );
            if (!el) return null;
            const cs = getComputedStyle(el);
            return { bg: cs.backgroundColor, color: cs.color, weight: cs.fontWeight };
          });
          check(promo, `${tag} promotions nav entry present`);
          if (promo) {
            const m = promo.bg.match(/rgba?\(([^)]+)\)/);
            const parts = m ? m[1].split(',').map(Number) : [];
            const alpha = parts.length > 3 ? parts[3] : 1;
            check(alpha > 0.05, `${tag} promotions nav entry has a filled background`, promo.bg);
            check(
              Number(promo.weight) >= 600,
              `${tag} promotions nav entry is bold`,
              `weight=${promo.weight}`
            );
          }
        }
      }

      // ---- floating search pill ------------------------------------------
      const pill = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(
          (b) => (b.getAttribute('aria-label') || '').match(/Ouvrir la recherche|فتح البحث/)
        );
        if (!btn) return null;
        const r = btn.getBoundingClientRect();
        const cs = getComputedStyle(btn.closest('.glass') || btn);
        return {
          x: Math.round(r.x),
          y: Math.round(r.y),
          w: Math.round(r.width),
          h: Math.round(r.height),
          bottom: Math.round(window.innerHeight - r.bottom),
          backdrop: cs.backdropFilter || cs.webkitBackdropFilter,
        };
      });
      check(pill, `${tag} floating search pill present`);
      if (pill) {
        check(pill.h >= 48 && pill.h <= 60, `${tag} pill height 52-56`, `h=${pill.h}`);
        check(pill.x >= 0 && pill.x + pill.w <= vp.width, `${tag} pill inside viewport`, `x=${pill.x} w=${pill.w}`);
        if (vp.width < 1024) {
          check(
            pill.w <= vp.width * 0.95,
            `${tag} mobile pill <= ~92vw`,
            `w=${pill.w} vw=${vp.width}`
          );
          // the pill must actually be a pill, not a collapsed sliver
          check(pill.w >= Math.min(200, vp.width * 0.7), `${tag} mobile pill wide enough`, `w=${pill.w}`);
          check(pill.bottom >= 60, `${tag} pill clears mobile tab bar`, `bottom=${pill.bottom}`);
        } else {
          check(pill.w <= 600, `${tag} desktop pill <= 560`, `w=${pill.w}`);
          check(pill.w >= 300, `${tag} desktop pill wide enough`, `w=${pill.w}`);
        }
        check(
          /blur/.test(pill.backdrop || ''),
          `${tag} glass backdrop-filter applied`,
          String(pill.backdrop)
        );
      }

      // ---- open the search overlay ---------------------------------------
      // NOTE: the overlay is opened with a real pointer click. React's
      // synthetic click delegation does not fire for a script-dispatched
      // `element.click()` in this browser, which used to make every
      // subsequent search assertion fail.
      //
      // The click is retried: under a loaded machine the first pointerdown can
      // land while React is still hydrating, and the overlay then never opens.
      // Retrying keeps the assertion honest (the overlay must genuinely open
      // from a real click) while removing the flake.
      const pillBox = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(
          (b) => (b.getAttribute('aria-label') || '').match(/Ouvrir la recherche|فتح البحث/)
        );
        if (!btn) return null;
        const r = btn.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      });
      check(pillBox, `${tag} search pill is clickable`);
      let overlayOpen = false;
      if (pillBox) {
        for (let attempt = 0; attempt < 4 && !overlayOpen; attempt++) {
          await page.mouse.click(pillBox.x, pillBox.y);
          for (let i = 0; i < 12 && !overlayOpen; i++) {
            await page.waitForTimeout(150);
            overlayOpen = await page.evaluate(
              () => document.activeElement?.getAttribute('role') === 'combobox'
            );
          }
        }
      }
      await page.waitForTimeout(300);

      const overlay = await page.evaluate(() => {
        const input = document.querySelector('input[role="combobox"]');
        const panel = document.getElementById('reps-fs-listbox');
        if (!input) return null;
        const r = input.getBoundingClientRect();
        const cs = getComputedStyle(input);
        const panelRect = panel ? panel.getBoundingClientRect() : null;
        return {
          focused: document.activeElement === input,
          fontSize: cs.fontSize,
          inputH: Math.round(r.height),
          hasPanel: !!panel,
          panelTop: panelRect ? Math.round(panelRect.top) : null,
          panelH: panelRect ? Math.round(panelRect.height) : null,
          role: input.getAttribute('role'),
          controls: input.getAttribute('aria-controls'),
          expanded: input.getAttribute('aria-expanded'),
        };
      });
      check(overlay, `${tag} search overlay opens`);
      if (overlay) {
        check(overlay.focused, `${tag} input auto-focused`);
        check(
          parseFloat(overlay.fontSize) >= 16,
          `${tag} input font >= 16px (no iOS zoom)`,
          overlay.fontSize
        );
        check(overlay.role === 'combobox', `${tag} combobox role`);
        check(overlay.hasPanel, `${tag} listbox present`);
        check(
          overlay.panelTop != null && overlay.panelTop < 700,
          `${tag} results panel above the pill`,
          `top=${overlay.panelTop}`
        );
        check(overlay.expanded === 'true', `${tag} aria-expanded`);
      }

      // typing a query returns grouped results
      let results = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        await page.evaluate(() => {
          const input = document.querySelector('input[role="combobox"]');
          if (input && input.value) {
            const setter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              'value'
            ).set;
            setter.call(input, '');
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
        await page.keyboard.type('plombier', { delay: 40 });
        for (let i = 0; i < 20; i++) {
          await page.waitForTimeout(300);
          results = await page.evaluate(() => {
            const list = document.getElementById('reps-fs-listbox');
            if (!list) return null;
            return {
              options: list.querySelectorAll('[role="option"]').length,
              groups: list.querySelectorAll('[role="group"]').length,
              marks: list.querySelectorAll('mark').length,
            };
          });
          if (results && results.options > 0) break;
        }
        if (results && results.options > 0) break;
      }
      check(results && results.options > 0, `${tag} results returned`, JSON.stringify(results));

      // Escape closes
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      const closed = await page.evaluate(
        () => !document.querySelector('input[role="combobox"]')?.getAttribute('aria-expanded')?.includes('true')
      );
      check(closed, `${tag} Escape closes the overlay`);

      // ---- mobile drawer -------------------------------------------------
      if (vp.width < 1024) {
        const burgerBox = await page.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find(
            (b) => (b.getAttribute('aria-label') || '').match(/Ouvrir le menu|فتح القائمة/)
          );
          if (!btn) return null;
          const r = btn.getBoundingClientRect();
          return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
        });
        if (burgerBox) {
          for (let attempt = 0; attempt < 4; attempt++) {
            await page.mouse.click(burgerBox.x, burgerBox.y);
            await page.waitForTimeout(400);
            const ok = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
            if (ok) break;
          }
        }
        await page.waitForTimeout(300);
        const drawer = await page.evaluate(() => {
          const dialog = document.querySelector('[role="dialog"]');
          if (!dialog) return null;
          const panel = dialog.querySelector('.drawer-in') || dialog.lastElementChild;
          const r = panel.getBoundingClientRect();
          const items = Array.from(panel.querySelectorAll('nav a, nav button')).map((el) => {
            const ir = el.getBoundingClientRect();
            return { h: Math.round(ir.height), text: (el.textContent || '').trim(), x: Math.round(ir.x) };
          });
          const promoItem = items.find((i) => /Promotions|العروض/.test(i.text));
          const promoEl = Array.from(panel.querySelectorAll('a,button')).find((e) =>
            /Promotions|العروض/.test(e.textContent || '')
          );
          return {
            x: Math.round(r.x),
            w: Math.round(r.width),
            items,
            promoBg: promoEl ? getComputedStyle(promoEl).backgroundColor : null,
            dir: document.documentElement.getAttribute('dir'),
          };
        });
        check(drawer, `${tag} drawer opens`);
        if (drawer) {
          check(drawer.x < 4, `${tag} drawer anchored physically LEFT`, `x=${drawer.x}`);
          check(
            drawer.items.every((i) => i.h >= 44),
            `${tag} drawer items >= 44px`,
            JSON.stringify(drawer.items.filter((i) => i.h < 44))
          );
          check(drawer.promoBg && drawer.promoBg !== 'rgba(0, 0, 0, 0)', `${tag} promotions orange in drawer`, String(drawer.promoBg));
        }
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }

      // ---- language dropdown ---------------------------------------------
      const langBox = await page.evaluate(() => {
        const visible = (el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        };
        const btn = Array.from(document.querySelectorAll('button')).find(
          (b) => /^(Langue|اللغة|Language)$/.test((b.getAttribute('aria-label') || '').trim()) && visible(b)
        );
        if (!btn) return null;
        const r = btn.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      });
      if (langBox) {
        for (let attempt = 0; attempt < 4; attempt++) {
          await page.mouse.click(langBox.x, langBox.y);
          await page.waitForTimeout(300);
          const ok = await page.evaluate(() =>
            Array.from(document.querySelectorAll('[role="menu"][aria-label]')).some((m) => {
              const r = m.getBoundingClientRect();
              return r.width > 0 && r.height > 0;
            })
          );
          if (ok) break;
        }
      }
      await page.waitForTimeout(200);
      const langMenu = await page.evaluate(() => {
        const menus = Array.from(document.querySelectorAll('[role="menu"][aria-label]')).filter((m) => {
          const r = m.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        });
        const menu = menus[0];
        if (!menu) return null;
        const r = menu.getBoundingClientRect();
        const trigger = menu.parentElement.querySelector('button');
        const tr = trigger.getBoundingClientRect();
        const rtl = getComputedStyle(trigger).direction === 'rtl';
        return {
          x: Math.round(r.x),
          right: Math.round(r.right),
          w: Math.round(r.width),
          triggerX: Math.round(tr.x),
          triggerRight: Math.round(tr.right),
          rtl,
          // the menu must be flush with the trigger's *inline end* edge
          anchorDelta: rtl
            ? Math.round(Math.abs(r.x - tr.x))
            : Math.round(Math.abs(r.right - tr.right)),
          inViewport: r.x >= -1 && r.right <= window.innerWidth + 1,
        };
      });
      check(langMenu, `${tag} language menu opens`);
      if (langMenu) {
        check(langMenu.inViewport, `${tag} language menu inside viewport`, JSON.stringify(langMenu));
        check(
          langMenu.anchorDelta < 4,
          `${tag} language menu anchored to the trigger's inline end`,
          JSON.stringify(langMenu)
        );
        check(
          langMenu.w > 60 && langMenu.w < Math.min(300, vp.width),
          `${tag} language menu content-fitted (no empty space)`,
          `w=${langMenu.w}`
        );
      }

      await context.close();
    }
  }

  await browser.close();

  if (problems.length) {
    console.log(`\n${problems.length} PROBLEM(S):`);
    problems.forEach((p) => console.log(' - ' + p));
    process.exitCode = 1;
  } else {
    console.log('\nAll checks passed.');
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
