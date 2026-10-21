/*
 * DEVELOPMENT-ONLY helper — DO NOT RUN AGAINST PRODUCTION.
 * ---------------------------------------------------------------------------
 * Assigns sponsored campaigns and promotions to real approved providers in the
 * LOCAL writable database (`src/data/db.json`, gitignored) so the marketing
 * rules can be exercised by hand and by the API.
 *
 *   - It refuses to run when `src/data/db.json` does not exist.
 *   - It never reads or writes `src/data/db.seed.json`.
 *   - It is idempotent: re-running produces exactly the same state.
 *
 * Usage:  node scripts/seed-marketing-test-cases.cjs
 *         node scripts/seed-marketing-test-cases.cjs --dry-run
 *         node scripts/seed-marketing-test-cases.cjs --revert
 *
 * `--revert` removes every field this helper wrote (matched by the [TEST]
 * marker) so the public catalogue carries no fictional discount again.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT, 'src', 'data', 'db.json');
const SEED_PATH = path.join(ROOT, 'src', 'data', 'db.seed.json');
const DRY_RUN = process.argv.includes('--dry-run');
const REVERT = process.argv.includes('--revert');

/** The marker every seeded field carries, used as the idempotency key. */
const TEST_MARKER = '[TEST]';
/** True when a field was written by this helper (title / description marker). */
const isSeeded = (value) => typeof value === 'string' && value.includes(TEST_MARKER);

const DAY = 24 * 60 * 60 * 1000;
// Fixed reference point: the system date at the moment the script runs (windows
// start on a whole day so the seeded values are stable and easy to read).
const NOW = new Date();
const iso = (ms) => new Date(ms).toISOString();
/** Whole-day ISO instant. Negative offsets already describe a past day, so the
 *  reference instant is nudged back one whole day to keep both ends of every
 *  window on the same calendar day (and stable across re-runs). */
const isoDay = (ms, end) => {
  const d = new Date(ms);
  d.setUTCHours(end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, 0);
  return d.toISOString();
};
const day = (offset) => {
  const ms = NOW.getTime() + offset * DAY;
  if (offset === 0) return isoDay(ms, true);
  return offset < 0 ? isoDay(ms, true) : isoDay(ms, false);
};

const IMAGES = {
  marrakech: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?q=80&w=800&auto=format&fit=crop',
  crafts: 'https://images.unsplash.com/photo-1524230572899-a752b3835840?q=80&w=800&auto=format&fit=crop',
  service: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=800&auto=format&fit=crop',
};

/* -------------------------------------------------------------------------- */
/* Test cases                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Each case targets a real approved provider, matched by category first and
 * falling back to its position in the list, so the script works on any copy of
 * the database. `key` is the idempotency key: providers already carrying the
 * campaign title / promotion description are left untouched.
 */
const CASES = [
  {
    key: 'promo-active-percent',
    label: 'promotion ACTIVE (percent)',
    match: { promotion: { description: '[TEST] -20% this month' } },
    promotion: {
      type: 'percent',
      value: 20,
      originalPrice: '250 DH',
      promotionalPrice: '200 DH',
      originalPriceValue: 250,
      promotionalPriceValue: 200,
      startDate: day(-7),
      endDate: day(30),
      description: '[TEST] -20% this month',
    },
  },
  {
    key: 'promo-active-fixed',
    label: 'promotion ACTIVE (fixed)',
    match: { promotion: { description: '[TEST] -50 DH off' } },
    promotion: {
      type: 'fixed',
      value: 50,
      originalPrice: '300 DH',
      promotionalPrice: '250 DH',
      originalPriceValue: 300,
      promotionalPriceValue: 250,
      startDate: day(-3),
      endDate: day(14),
      description: '[TEST] -50 DH off',
    },
  },
  {
    key: 'promo-active-price',
    label: 'promotion ACTIVE (price)',
    match: { promotion: { description: '[TEST] fixed price offer' } },
    promotion: {
      type: 'price',
      value: 0,
      originalPrice: '400 DH',
      promotionalPrice: '299 DH',
      originalPriceValue: 400,
      promotionalPriceValue: 299,
      startDate: day(-1),
      endDate: day(10),
      description: '[TEST] fixed price offer',
    },
  },
  {
    key: 'promo-future',
    label: 'promotion FUTURE (scheduled)',
    match: { promotion: { description: '[TEST] starts next month' } },
    promotion: {
      type: 'percent',
      value: 10,
      originalPrice: '120 DH',
      promotionalPrice: '108 DH',
      originalPriceValue: 120,
      promotionalPriceValue: 108,
      startDate: day(20),
      endDate: day(50),
      description: '[TEST] starts next month',
    },
  },
  {
    key: 'promo-expired',
    label: 'promotion EXPIRED',
    match: { promotion: { description: '[TEST] ended last month' } },
    promotion: {
      type: 'percent',
      value: 25,
      originalPrice: '200 DH',
      promotionalPrice: '150 DH',
      originalPriceValue: 200,
      promotionalPriceValue: 150,
      startDate: day(-60),
      endDate: day(-30),
      description: '[TEST] ended last month',
    },
  },
  {
    key: 'promo-disabled',
    label: 'promotion DISABLED (no promotion object)',
    match: { promotion: null },
    promotion: null,
  },
  {
    key: 'promo-invalid-pricing',
    label: 'promotion INVALID (promotional >= original)',
    // Deliberately broken: stored so the server-side rules can be exercised
    // (it is rejected at the API level AND hidden by lib/marketing).
    match: { promotion: { description: '[TEST] INVALID price pair' } },
    promotion: {
      type: 'percent',
      value: 20,
      originalPrice: '150 DH',
      promotionalPrice: '180 DH',
      originalPriceValue: 150,
      promotionalPriceValue: 180,
      startDate: day(-2),
      endDate: day(12),
      description: '[TEST] INVALID price pair',
    },
  },
  {
    key: 'sponsor-active',
    label: 'sponsored ACTIVE',
    match: { sponsored: { title: '[TEST] Active placement' } },
    sponsored: {
      active: true,
      title: '[TEST] Active placement',
      image: IMAGES.marrakech,
      priority: 10,
      placement: 'both',
      startDate: day(-7),
      endDate: day(30),
      href: '/fr/services',
      notes: 'Development test campaign.',
    },
  },
  {
    key: 'sponsor-future',
    label: 'sponsored FUTURE (scheduled)',
    match: { sponsored: { title: '[TEST] Scheduled placement' } },
    sponsored: {
      active: true,
      title: '[TEST] Scheduled placement',
      image: IMAGES.crafts,
      priority: 5,
      placement: 'home',
      startDate: day(15),
      endDate: day(45),
      href: '/fr/promotions',
    },
  },
  {
    key: 'sponsor-expired',
    label: 'sponsored EXPIRED',
    match: { sponsored: { title: '[TEST] Expired placement' } },
    sponsored: {
      active: true,
      title: '[TEST] Expired placement',
      image: IMAGES.service,
      priority: 1,
      placement: 'services',
      startDate: day(-45),
      endDate: day(-15),
    },
  },
  {
    key: 'sponsor-disabled',
    label: 'sponsored DISABLED (switch off)',
    match: { sponsored: { title: '[TEST] Disabled placement' } },
    sponsored: {
      active: false,
      title: '[TEST] Disabled placement',
      image: IMAGES.crafts,
      priority: 0,
      placement: 'both',
      startDate: day(-7),
      endDate: day(30),
    },
  },
  {
    key: 'sponsor-no-image',
    label: 'sponsored ACTIVE without image',
    match: { sponsored: { title: '[TEST] Active placement without image' } },
    sponsored: {
      active: true,
      title: '[TEST] Active placement without image',
      image: '',
      priority: 2,
      placement: 'home',
      startDate: day(-7),
      endDate: day(30),
    },
  },
  {
    key: 'no-promotion',
    label: 'no promotion at all',
    match: { promotion: null, sponsored: null },
    promotion: null,
    sponsored: null,
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

if (!fs.existsSync(DB_PATH)) {
  fail(
    `Local database not found at ${path.relative(ROOT, DB_PATH)}.\n` +
      '  This script only touches the local writable database — it never writes to db.seed.json.\n' +
      '  Start the dev server once (or copy db.seed.json to db.json) and run it again.'
  );
}

if (path.resolve(DB_PATH) === path.resolve(SEED_PATH)) {
  fail('Refusing to run: the target resolved to db.seed.json.');
}

let db;
try {
  db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
} catch (err) {
  fail(`Could not parse ${path.relative(ROOT, DB_PATH)}: ${err.message}`);
}

if (!Array.isArray(db.users)) fail('The database has no users array.');

// Eligible providers: a real, approved provider on a normal account.
const eligible = db.users.filter(
  (u) =>
    u &&
    u.provider &&
    u.providerStatus === 'approved' &&
    u.status === 'active' &&
    u.role !== 'admin' &&
    typeof u.provider.category === 'string'
);

if (eligible.length < CASES.length) {
  fail(
    `Not enough approved providers in the local database (found ${eligible.length}, need ${CASES.length}).` +
      ' Approve more providers in /admin first.'
  );
}

// Prefer a different category for each case so the results are easy to spot.
const byCategory = new Map();
for (const u of eligible) {
  const key = u.provider.category;
  if (!byCategory.has(key)) byCategory.set(key, []);
  byCategory.get(key).push(u);
}

const picked = [];
const used = new Set();
for (const u of byCategory.values()) {
  if (picked.length >= CASES.length) break;
  picked.push(u[0]);
  used.add(u[0].id);
}
for (const u of eligible) {
  if (picked.length >= CASES.length) break;
  if (!used.has(u.id)) {
    picked.push(u);
    used.add(u.id);
  }
}

// Describe a stored campaign/promotion: only the fields this script manages,
// so re-runs converge on exactly the same values.
function campaignShape(raw) {
  if (!raw) return null;
  return {
    active: raw.active,
    title: raw.title,
    image: raw.image,
    priority: raw.priority,
    startDate: raw.startDate,
    endDate: raw.endDate,
    placement: raw.placement,
    href: raw.href,
    notes: raw.notes,
  };
}

function promotionShape(raw) {
  if (!raw) return null;
  return {
    type: raw.type,
    value: raw.value,
    originalPrice: raw.originalPrice,
    promotionalPrice: raw.promotionalPrice,
    originalPriceValue: raw.originalPriceValue,
    promotionalPriceValue: raw.promotionalPriceValue,
    startDate: raw.startDate,
    endDate: raw.endDate,
    description: raw.description,
  };
}

function normalize(value) {
  // Undefined and missing keys compare equal, so objects converge on re-run.
  if (value === undefined) return null;
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = normalize(value[key]);
    return out;
  }
  return value;
}

const same = (a, b) => JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));

/* -------------------------------------------------------------------------- */
/* Apply                                                                       */
/* -------------------------------------------------------------------------- */

const rows = [];
let changed = 0;

/* -------------------------------------------------------------------------- */
/* Revert                                                                      */
/* -------------------------------------------------------------------------- */
/* Removes every marketing value this helper wrote (identified by the [TEST]
 * marker on the promotion description or the campaign title/notes) and restores
 * the provider to "no marketing data". Use this before taking screenshots of, or
 * demoing, the real catalogue, so no fictional discount is ever published. */
if (REVERT) {
  const reverted = [];
  for (const user of eligible) {
    const provider = user.provider;
    if (!provider) continue;
    const promoIsSeeded =
      provider.promotion &&
      (isSeeded(provider.promotion.description) || isSeeded(provider.promotion.label));
    const sponsorIsSeeded =
      provider.sponsored &&
      (isSeeded(provider.sponsored.title) || isSeeded(provider.sponsored.notes));
    if (!promoIsSeeded && !sponsorIsSeeded) continue;

    if (promoIsSeeded) provider.promotion = null;
    if (sponsorIsSeeded) provider.sponsored = null;
    reverted.push(`${user.firstName} ${user.lastName} (${provider.category})`);
    changed += 1;
  }

  console.log('\n⚠  DEVELOPMENT-ONLY HELPER — reverting seeded marketing data.');
  console.log(`   Target: ${path.relative(ROOT, DB_PATH)}`);
  console.log(`\n   ${changed} provider(s) ${DRY_RUN ? 'would be cleared' : 'cleared'}.\n`);
  for (const name of reverted) console.log(`   - ${name}`);

  if (DRY_RUN) {
    console.log('\n--dry-run: nothing was written.\n');
    process.exit(0);
  }
  if (changed > 0) {
    const tmpPath = `${DB_PATH}.seed-tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2));
    fs.renameSync(tmpPath, DB_PATH);
    console.log(`\n✔ Saved ${path.relative(ROOT, DB_PATH)}.\n`);
  }
  process.exit(0);
}

for (let i = 0; i < CASES.length; i += 1) {
  const testCase = CASES[i];
  const user = picked[i];
  const provider = user.provider;

  const nextPromotion = testCase.promotion === undefined ? provider.promotion ?? null : testCase.promotion;
  const nextSponsored = testCase.sponsored === undefined ? provider.sponsored ?? null : testCase.sponsored;

  const promotionMatches = same(promotionShape(provider.promotion ?? null), promotionShape(nextPromotion));
  const sponsoredMatches = same(campaignShape(provider.sponsored ?? null), campaignShape(nextSponsored));

  if (promotionMatches && sponsoredMatches) {
    rows.push([testCase.label, `${user.firstName} ${user.lastName}`, provider.category, 'already set']);
    continue;
  }

  provider.promotion = nextPromotion ? { ...nextPromotion } : null;
  provider.sponsored = nextSponsored ? { ...nextSponsored } : null;
  changed += 1;
  rows.push([testCase.label, `${user.firstName} ${user.lastName}`, provider.category, 'updated']);
}

/* -------------------------------------------------------------------------- */
/* Report + write                                                              */
/* -------------------------------------------------------------------------- */

const width = rows.reduce(
  (acc, row, i) => acc.map((w, c) => Math.max(w, String(row[c]).length)),
  ['CASE', 'PROVIDER', 'CATEGORY', 'RESULT'].map((h) => h.length)
);
const line = (cells) => '| ' + cells.map((c, i) => String(c).padEnd(width[i])).join(' | ') + ' |';
const rule = '+' + width.map((w) => '-'.repeat(w + 2)).join('+') + '+';

console.log('\n⚠  DEVELOPMENT-ONLY HELPER — do not run against production.');
console.log(`   Target: ${path.relative(ROOT, DB_PATH)} (never ${path.relative(ROOT, SEED_PATH)})`);
console.log(`   Reference "now": ${NOW.toISOString()}`);
console.log(`\n   ${changed} of ${CASES.length} case(s) ${DRY_RUN ? 'would change' : 'changed'}.\n`);
console.log(rule);
console.log(line(['CASE', 'PROVIDER', 'CATEGORY', 'RESULT']));
console.log(rule);
for (const row of rows) console.log(line(row));
console.log(rule);

if (DRY_RUN) {
  console.log('\n--dry-run: nothing was written.\n');
  process.exit(0);
}

const tmpPath = `${DB_PATH}.seed-tmp`;
fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2));
fs.renameSync(tmpPath, DB_PATH);
console.log(`\n✔ Saved ${path.relative(ROOT, DB_PATH)}.\n`);
