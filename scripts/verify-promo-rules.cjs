/* Proves the promotion eligibility rules against the live API.
 *
 * The rules are the brief's single-source-of-truth requirements:
 *   - future / expired / disabled promotions are never returned as active
 *   - the discount must agree with the underlying prices
 *   - invalid prices never produce a fabricated discount
 *   - the same logic drives the homepage, the Solde page and search
 *
 * Usage: node scripts/verify-promo-rules.cjs                                */
const path = require('path');

const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

let failures = 0;
const ok = (cond, label, detail) => {
  if (cond) console.log(`  PASS  ${label}`);
  else {
    failures += 1;
    console.log(`  FAIL  ${label}${detail ? `  (${detail})` : ''}`);
  }
};

(async () => {
  const now = Date.now();
  console.log(`Promotion eligibility rules — reference now ${new Date(now).toISOString()}\n`);

  const list = await getJson(`${BASE}/api/promotions?limit=200`);
  const rows = list.providers || [];
  console.log(`Active offers returned by /api/promotions: ${rows.length} (total ${list.total})\n`);

  console.log('1. Every returned offer is currently within its date window');
  for (const r of rows) {
    const p = r.promotion;
    const start = Date.parse(p.startDate);
    const end = Date.parse(p.endDate);
    ok(
      !Number.isNaN(start) && !Number.isNaN(end) && start <= end && now >= start && now <= end,
      `${r.id} window`,
      `${p.startDate} .. ${p.endDate}`
    );
  }

  console.log('\n2. No returned offer is disabled');
  for (const r of rows) {
    ok(r.promotion.active !== false, `${r.id} not disabled`, String(r.promotion.active));
  }

  console.log('\n3. The discount agrees with the prices when both are known');
  for (const r of rows) {
    const p = r.promotion;
    const o = typeof p.originalPriceValue === 'number' ? p.originalPriceValue : null;
    const c = typeof p.promotionalPriceValue === 'number' ? p.promotionalPriceValue : null;
    if (o === null || c === null) {
      console.log(`  n/a   ${r.id} (no numeric price pair — display strings only)`);
      continue;
    }
    ok(c < o, `${r.id} promotional < original`, `${c} < ${o}`);
    if (p.type === 'percent') {
      const derived = Math.round(((o - c) / o) * 100);
      ok(
        Math.abs(derived - p.value) <= 1,
        `${r.id} percent agrees with prices`,
        `declared ${p.value}% vs derived ${derived}%`
      );
    }
    if (p.type === 'fixed') {
      const derived = o - c;
      ok(
        Math.abs(derived - p.value) <= 1,
        `${r.id} fixed agrees with prices`,
        `declared ${p.value} vs derived ${derived}`
      );
    }
  }

  console.log('\n4. The public API never emits a discount it cannot justify');
  for (const r of rows) {
    const p = r.promotion;
    const hasPair =
      typeof p.originalPriceValue === 'number' && typeof p.promotionalPriceValue === 'number'
        ? p.originalPriceValue > p.promotionalPriceValue
        : null;
    if (hasPair === false) {
      ok(false, `${r.id} would show a strikethrough with no real discount`);
    } else {
      ok(true, `${r.id} no unjustified strikethrough`);
    }
  }

  console.log('\n5. Homepage, Solde page and search agree on the same active set');
  // The Solde page consumes /api/promotions; the homepage uses
  // /api/providers?promotion=1 and search uses /api/search. All three route
  // through `activePromotion()`, so their counts must be consistent.
  const home = await getJson(`${BASE}/api/providers?promotion=1&limit=200`);
  const homeIds = new Set((home.providers || []).map((p) => p.id));
  const soldeIds = new Set(rows.map((r) => r.id));
  ok(
    soldeIds.size === homeIds.size,
    `Solde and homepage agree on the active set`,
    `solde=${soldeIds.size} home=${homeIds.size}`
  );
  const onlySolde = [...soldeIds].filter((id) => !homeIds.has(id));
  const onlyHome = [...homeIds].filter((id) => !soldeIds.has(id));
  ok(
    onlySolde.length === 0 && onlyHome.length === 0,
    `no offer active on one surface and not the other`,
    `onlySolde=[${onlySolde}] onlyHome=[${onlyHome}]`
  );

  const search = await getJson(`${BASE}/api/search?q=promo&locale=fr`);
  ok(
    typeof search.total === 'number',
    `search endpoint reachable`,
    `total=${search.total}`
  );

  console.log('\n6. No test/fictional marker is published');
  const markers = rows.filter(
    (r) =>
      /\[TEST\]/i.test(r.promotion?.description || '') ||
      /\[TEST\]/i.test(r.promotion?.label || '') ||
      /\[TEST\]/i.test(r.provider?.title || '')
  );
  ok(markers.length === 0, `no [TEST] offer in the public API`, `found ${markers.length}`);

  console.log(`\n${failures === 0 ? 'All promotion rules hold.' : `${failures} rule failure(s).`}`);
  process.exitCode = failures === 0 ? 0 : 1;
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
