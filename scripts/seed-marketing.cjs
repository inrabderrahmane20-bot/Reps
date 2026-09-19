// Adds realistic marketing test data (sponsored placements + promotions) to
// the demo database. Run:  node scripts/seed-marketing.cjs
//
// It is idempotent for the fixture ids below and only touches those providers.
// The windows below are relative to the "today" date used when authoring the
// fixture (2026-09-19): some campaigns are active, some already expired and
// some not yet started, so the frontend date logic can be verified.

const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'data', 'db.seed.json');
const db = JSON.parse(fs.readFileSync(file, 'utf8'));
const byId = new Map(db.users.map((u) => [u.id, u]));

const IMG = {
  plomberie: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=900&auto=format&fit=crop',
  electricite: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=900&auto=format&fit=crop',
  nettoyage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=900&auto=format&fit=crop',
  beaute: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=900&auto=format&fit=crop',
  jardin: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=900&auto=format&fit=crop',
  auto: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=900&auto=format&fit=crop',
  tech: 'https://images.unsplash.com/photo-1593642532744-d377ab507dc8?q=80&w=900&auto=format&fit=crop',
};

const ACTIVE = { start: '2026-09-01T00:00:00.000Z', end: '2026-10-31T23:59:59.000Z' };
const EXPIRED = { start: '2026-07-01T00:00:00.000Z', end: '2026-08-31T23:59:59.000Z' };
const FUTURE = { start: '2026-11-01T00:00:00.000Z', end: '2026-12-31T23:59:59.000Z' };

// --- Sponsored placements ------------------------------------------------
// Actively sponsored (within window). `both` also receives a promotion below.
const SPONSORED = [
  { id: 'u_catalog_11_1', priority: 7, image: IMG.electricite }, // Électricité
  { id: 'u_catalog_152_1', priority: 6, image: IMG.beaute }, // Coiffure
  { id: 'u_catalog_1_2', priority: 5, image: IMG.plomberie, both: true }, // Plomberie
  { id: 'u_catalog_75_1', priority: 4, image: IMG.nettoyage }, // Nettoyage
  { id: 'u_catalog_121_2', priority: 3, image: IMG.tech }, // Informatique
  { id: 'u_catalog_101_3', priority: 2, image: IMG.auto }, // Automobile
  { id: 'u_catalog_90_5', priority: 1, image: IMG.jardin, both: true }, // Jardin
  { id: 'u_catalog_1_1', priority: 0, image: IMG.plomberie }, // Plomberie (2nd)
];
// Expired sponsorship (must NOT appear in sponsored placements).
const SPONSORED_EXPIRED = [{ id: 'u_catalog_11_5', priority: 8, image: IMG.electricite, window: EXPIRED }];
// Future sponsorship (must NOT appear until it starts).
const SPONSORED_FUTURE = [{ id: 'u_catalog_75_5', priority: 9, image: IMG.nettoyage, window: FUTURE }];

// --- Promotions ----------------------------------------------------------
const PROMOS = [
  // Active, various types
  { id: 'u_catalog_151_1', type: 'percent', value: 20, originalPrice: '100 DH', promotionalPrice: '80 DH', image: IMG.beaute, description: 'Coupe + coiffage à prix réduit cette semaine.' },
  { id: 'u_p3', type: 'percent', value: 30, originalPrice: '150 DH', promotionalPrice: '105 DH', image: IMG.nettoyage, description: 'Premier nettoyage complet -30% pour les nouveaux clients.' },
  { id: 'u_catalog_90_1', type: 'percent', value: 15, originalPrice: '200 DH', promotionalPrice: '170 DH', image: IMG.jardin, description: 'Entretien de jardin à -15% en septembre.' },
  { id: 'u_catalog_90_2', type: 'fixed', value: 25, originalPrice: '100 DH', promotionalPrice: '75 DH', image: IMG.jardin, description: 'Taille de haies : -25 DH.' },
  { id: 'u_catalog_101_2', type: 'fixed', value: 101, originalPrice: '500 DH', promotionalPrice: '399 DH', image: IMG.auto, description: 'Révision complète : 500 DH → 399 DH.' },
  { id: 'u_catalog_122_1', type: 'price', value: 0, originalPrice: '249 DH', promotionalPrice: '149 DH', image: IMG.tech, description: 'Installation Windows + nettoyage antivirus à 149 DH.' },
  { id: 'u_catalog_75_2', type: 'percent', value: 25, originalPrice: '200 DH', promotionalPrice: '150 DH', image: IMG.nettoyage, description: 'Nettoyage de printemps -25%.' },
  { id: 'u_catalog_121_4', type: 'percent', value: 10, originalPrice: '250 DH', promotionalPrice: '225 DH', image: IMG.tech, description: 'Réparation ordinateur à -10%.' },
  { id: 'u_catalog_11_4', type: 'fixed', value: 50, originalPrice: '200 DH', promotionalPrice: '150 DH', image: IMG.electricite, description: 'Dépannage électrique : -50 DH.' },
  { id: 'u_catalog_1_4', type: 'percent', value: 20, originalPrice: '300 DH', promotionalPrice: '240 DH', image: IMG.plomberie, description: 'Installation sanitaire -20%.' },
  // Expired (must NOT appear) and future (must NOT appear yet)
  { id: 'u_catalog_75_3', type: 'percent', value: 15, image: IMG.nettoyage, window: EXPIRED, description: 'Offre d’août terminée.' },
  { id: 'u_catalog_11_2', type: 'percent', value: 20, image: IMG.electricite, window: FUTURE, description: 'Offre de novembre à venir.' },
];

function setSponsor(u, spec) {
  const window = spec.window || ACTIVE;
  u.provider.sponsored = {
    active: true,
    image: spec.image,
    priority: spec.priority,
    startDate: window.start,
    endDate: window.end,
  };
  if (spec.priority === undefined) console.warn('missing priority', spec.id);
}

function setPromo(u, spec) {
  const window = spec.window || ACTIVE;
  u.provider.promotion = {
    type: spec.type,
    value: spec.value || 0,
    originalPrice: spec.originalPrice,
    promotionalPrice: spec.promotionalPrice,
    startDate: window.start,
    endDate: window.end,
    description: spec.description,
    image: spec.image || null,
  };
}

let sponsoredCount = 0;
let promoCount = 0;
let missed = [];

for (const spec of SPONSORED) {
  const u = byId.get(spec.id);
  if (!u || !u.provider) { missed.push(spec.id); continue; }
  setSponsor(u, spec);
  sponsoredCount++;
}
for (const spec of [...SPONSORED_EXPIRED, ...SPONSORED_FUTURE]) {
  const u = byId.get(spec.id);
  if (!u || !u.provider) { missed.push(spec.id); continue; }
  setSponsor(u, spec);
  sponsoredCount++;
}
for (const spec of PROMOS) {
  const u = byId.get(spec.id);
  if (!u || !u.provider) { missed.push(spec.id); continue; }
  setPromo(u, spec);
  promoCount++;
}
// Sponsored + promotional combinations
for (const spec of SPONSORED.filter((s) => s.both)) {
  const u = byId.get(spec.id);
  if (!u || !u.provider) continue;
  const promoSpec = spec.id === 'u_catalog_1_2'
    ? { type: 'percent', value: 20, originalPrice: '250 DH', promotionalPrice: '200 DH', image: IMG.plomberie, description: 'Plomberie : -20% ce mois-ci.' }
    : { type: 'fixed', value: 50, originalPrice: '180 DH', promotionalPrice: '130 DH', image: IMG.jardin, description: 'Entretien de jardin : -50 DH.' };
  setPromo(u, promoSpec);
  promoCount++;
}

fs.writeFileSync(file, JSON.stringify(db, null, 2) + '\n', 'utf8');

// Refresh the local writable database if one exists, so a running dev server
// picks up the seeded marketing data instead of an older db.json shadowing it.
const runtimeFile = path.join(__dirname, '..', 'src', 'data', 'db.json');
if (fs.existsSync(runtimeFile)) {
  fs.copyFileSync(file, runtimeFile);
  console.log('refreshed local db.json');
}

console.log(`Done: ${sponsoredCount} sponsored, ${promoCount} promotions. Missed: ${missed.length ? missed.join(', ') : 'none'}`);