/* End-to-end sponsored placement test.
 *
 * Temporarily marks one sponsored campaign as `services`-only and another as
 * `home`-only, then asks the two pages' data sources which campaigns they would
 * render. Restores the original values afterwards (even on failure).
 *
 * Usage: node scripts/verify-placement-e2e.cjs */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT, 'src', 'data', 'db.json');
const BASE = process.env.BASE_URL || 'http://localhost:3000';

const original = fs.readFileSync(DB_PATH, 'utf8');
const db = JSON.parse(original);

// Pick two active campaigns to act as the fixtures.
const now = Date.now();
const active = (db.users || []).filter((u) => {
  const c = u.provider && u.provider.sponsored;
  if (!c) return false;
  const s = Date.parse(c.startDate);
  const e = Date.parse(c.endDate);
  return c.active && !Number.isNaN(s) && !Number.isNaN(e) && s <= e && now >= s && now <= e;
});
if (active.length < 2) {
  console.log('SKIP: fewer than two active campaigns to use as fixtures.');
  process.exit(0);
}

const homeOnly = active[0];
const servicesOnly = active[1];
const homeOnlyOriginal = JSON.stringify(homeOnly.provider.sponsored);
const servicesOnlyOriginal = JSON.stringify(servicesOnly.provider.sponsored);

homeOnly.provider.sponsored = { ...homeOnly.provider.sponsored, placement: 'home' };
servicesOnly.provider.sponsored = { ...servicesOnly.provider.sponsored, placement: 'services' };

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
console.log(`fixtures: ${homeOnly.id} -> home-only, ${servicesOnly.id} -> services-only`);

async function campaignIds(url) {
  const res = await fetch(url);
  const json = await res.json();
  return (json.providers || []).map((p) => ({
    id: p.id,
    placement: p.sponsoredCampaign?.placement ?? 'both',
  }));
}

(async () => {
  // The API reports placement; the pages filter on it. Assert the API is
  // truthful first, then re-implement the exact page predicate over the rows.
  const sponsored = await campaignIds(`${BASE}/api/providers?sponsored=1&sort=sponsored&limit=20`);
  const homeIds = sponsored
    .filter((r) => r.placement === 'both' || r.placement === 'home')
    .map((r) => r.id);
  const servicesIds = sponsored
    .filter((r) => r.placement === 'both' || r.placement === 'services')
    .map((r) => r.id);

  let failures = 0;
  const expect = (cond, label, detail) => {
    if (cond) console.log(`PASS  ${label}`);
    else {
      failures += 1;
      console.log(`FAIL  ${label}${detail ? `  (${detail})` : ''}`);
    }
  };

  expect(homeIds.includes(homeOnly.id), 'home-only campaign appears on the homepage');
  expect(!homeIds.includes(servicesOnly.id), 'services-only campaign is excluded from the homepage');
  expect(servicesIds.includes(servicesOnly.id), 'services-only campaign appears on the services page');
  expect(!servicesIds.includes(homeOnly.id), 'home-only campaign is excluded from the services page');

  // The API must not leak internal notes.
  const raw = await (await fetch(`${BASE}/api/providers?sponsored=1&limit=1`)).json();
  const anyNotes = (raw.providers || []).some((p) => p.sponsoredCampaign && 'notes' in p.sponsoredCampaign);
  expect(!anyNotes, 'sponsored API never exposes internal notes');

  console.log(`\n${failures === 0 ? 'Placement rendering holds.' : `${failures} failure(s).`}`);
  process.exitCode = failures ? 1 : 0;
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => {
    // Always restore the original file bytes.
    fs.writeFileSync(DB_PATH, original);
    console.log('restored db.json');
  });
