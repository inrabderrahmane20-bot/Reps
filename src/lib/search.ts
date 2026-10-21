// Shared search primitives — normalisation, lightweight fuzzy scoring and
// match highlighting.
//
// Pure TypeScript with no Node APIs so it can run both in the `/api/search`
// route handler (server side) and inside the floating-search component
// (client side, for highlighting and local filtering).
//
// Normalisation rules
//   • Latin text: NFD + strip combining marks (so "électricien" matches
//     "electricien"), lower-cased, whitespace collapsed.
//   • Arabic text: tashkeel/diacritics and tatweel removed, alef variants
//     unified (أ إ آ ٱ → ا), ة → ه, ى → ي, ؤ → و, ئ → ي. This keeps Arabic
//     searches forgiving without altering the stored text.

/** Combining diacritics (Latin + Arabic) and tatweel. */
const DIACRITICS = /[\u0300-\u036f\u064b-\u0652\u0670\u0640]/g;
const ARABIC_MAP: Record<string, string> = {
  '\u0623': '\u0627', // أ → ا
  '\u0625': '\u0627', // إ → ا
  '\u0622': '\u0627', // آ → ا
  '\u0671': '\u0627', // ٱ → ا
  '\u0629': '\u0647', // ة → ه
  '\u0649': '\u064a', // ى → ي
  '\u0624': '\u0648', // ؤ → و
  '\u0626': '\u064a', // ئ → ي
};

/** Fold a string into a comparable, accent-insensitive form. */
export function normalizeText(value: string): string {
  if (!value) return '';
  let out = '';
  for (const ch of value.normalize('NFD')) {
    const mapped = ARABIC_MAP[ch] ?? ch;
    if (DIACRITICS.test(mapped)) {
      DIACRITICS.lastIndex = 0;
      continue;
    }
    DIACRITICS.lastIndex = 0;
    out += mapped;
  }
  return out
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalise a string while keeping a map back to the original character
 * positions, so a match found in the normalised text can be highlighted in
 * the original text without breaking Arabic shaping.
 */
export function normalizeWithMap(value: string): { text: string; origin: number[] } {
  const chars = [...value];
  const out: string[] = [];
  const origin: number[] = [];

  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i];
    const folded = ch.normalize('NFD');
    for (const f of folded) {
      const mapped = ARABIC_MAP[f] ?? f;
      if (DIACRITICS.test(mapped)) {
        DIACRITICS.lastIndex = 0;
        continue;
      }
      DIACRITICS.lastIndex = 0;
      if (!/[\p{L}\p{N}\s]/u.test(mapped)) {
        out.push(' ');
        origin.push(i);
        continue;
      }
      out.push(mapped.toLowerCase());
      origin.push(i);
    }
  }

  return { text: out.join('').replace(/\s+/g, ' ').trim(), origin };
}

/**
 * Arabic → French vocabulary bridge.
 *
 * The marketplace catalogue is authored in French (it is the source of truth
 * for the taxonomy), while the interface is available in Arabic. Without this
 * bridge an Arabic query such as "سبّاك" would never reach the French records.
 * Each entry maps one Arabic term to the French words used by the catalogue.
 *
 * Keys are normalised at module load, so they can be written naturally.
 */
const RAW_ALIASES: Record<string, string[]> = {
  // Plumbing / electricity / building
  'سبّاك': ['plombier', 'plomberie'],
  'سباك': ['plombier', 'plomberie'],
  'سباكة': ['plomberie', 'installation plomberie'],
  'تسريب': ['fuite', 'recherche de fuite'],
  'كهربائي': ['electricien', 'electricite'],
  'كهرباء': ['electricite', 'installation electrique'],
  'مفتاح': ['serrure', 'serrurier', 'changement serrure'],
  'خزان': ['chauffe eau'],
  'نجار': ['menuiserie', 'fabrication meubles', 'montage meubles'],
  'حداد': ['serrurier', 'structures metalliques', 'gardes corps'],
  'حدادة': ['serrurerie', 'structures metalliques'],
  'بنّاء': ['construction', 'maconnerie'],
  'بناء': ['construction', 'renovation'],
  'دهان': ['peinture', 'peintre'],
  'صباغ': ['peinture'],
  'ديكور': ['decoration'],
  'ديكور داخل': ['decoration interieure'],
  'نجارة': ['fabrication meubles', 'montage meubles', 'menuiserie'],
  'أثاث': ['meubles', 'canapes'],
  'نقل الأثاث': ['demenagement', 'transport mobilier'],
  'تكييف': ['climatisation'],
  'مكيف': ['climatisation'],
  'تنظيف': ['nettoyage', 'nettoyant'],
  'نظافة': ['nettoyage'],
  'تعقيم': ['desinfection'],
  'مكافحة حشرات': ['desinsectisation'],
  'مكافحة القوارض': ['deratisation'],
  'غسيل سجاد': ['nettoyage tapis'],
  'كنب': ['nettoyage canape'],
  'حديقة': ['jardin', 'entretien jardin'],
  'بستاني': ['paysagiste'],
  'تقليم': ['taille', 'elagage'],
  'قص': ['taille', 'elagage'],
  'مراقبة': ['surveillance', 'gardiennage'],
  'حارس': ['gardien', 'agent de securite'],
  'أمن': ['securite', 'gardien'],
  'كاميرات': ['cameras', 'installation camera'],
  'إنذار': ['alarmes', 'alarme securite'],
  'محاسب': ['comptabilite'],
  'محامي': ['conseil'],
  'مترجم': ['traduction', 'interpretation'],
  'سائق': ['chauffeur prive', 'chauffeur'],
  'نقل': ['transport', 'livraison', 'demenagement'],
  'توصيل': ['livraison'],
  'مطبخ': ['cuisine', 'cuisinier'],
  'طباخ': ['cuisinier', 'chef a domicile'],
  'خباز': ['boulanger'],
  'حلاق': ['barbier', 'coiffure'],
  'تصفيف': ['coiffure', 'brushing'],
  'مكياج': ['maquillage', 'estheticienne'],
  'مساج': ['massage'],
  'حمام': ['hammam'],
  'رخاء': ['spa', 'spa a domicile'],
  'خياط': ['confection', 'retouches', 'sur mesure'],
  'تطريز': ['broderie'],
  'جلود': ['cuir', 'maroquinerie'],
  'حرف': ['artisanat marocain', 'poterie'],
  'زليج': ['zellige'],
  'نحت': ['bois sculpte'],
  'زفاف': ['wedding planner', 'mariage'],
  'حفل': ['evenementiel', 'animation', 'wedding planner'],
  'ضيافة طعام': ['traiteur'],
  'مأكلة': ['traiteur'],
  'dj': ['dj'],
  'تصوير': ['photographe', 'photographie'],
  'فيديو': ['videaste', 'montage video'],
  'صوت': ['sonorisation', 'musiciens'],
  'موسيقى': ['musique', 'groupe traditionnel'],
  'معدات': ['location', 'materiel'],
  'كراء': ['location'],
  'تأجير': ['location'],
  'شبابيك': ['fenetres'],
  'باب': ['porte', 'ouverture de porte', 'portes'],
  'زجاج': ['vitrier', 'vitre cassee'],
  'محرك': ['moteur'],
  'فرامل': ['freins'],
  'إطارات': ['pneumatique'],
  'بطارية': ['batterie'],
  'زيت': ['vidange'],
  'غسيل سيارة': ['lavage automobile'],
  'ميكانيكي': ['diagnostic', 'automobile', 'moteur'],
  'تبديل زيت': ['vidange'],
  'دروس': ['soutien scolaire', 'cours particuliers'],
  'رياضيات': ['mathematiques'],
  'فيزياء': ['physique'],
  'إنجليزية': ['anglais'],
  'فرنسية': ['francais'],
  'لغة عربية': ['arabe'],
  'برمجة': ['programmation'],
  'موقع إلكتروني': ['creation site web', 'developpement web'],
  'تصميم': ['graphisme'],
  'طباعة': ['impression'],
  'بيطري': ['veterinaire'],
  'حيوانات': ['toiletteur', 'pet sitter', 'promenade'],
  'مشاية الكلاب': ['dog walking', 'promenade'],
  'قوات': ['gardien', 'agent de securite'],
  'تسويق': ['marketing'],
  'إدارة': ['community management', 'assistance administrative'],
  'كتابة': ['secrariat', 'traduction'],
  'ترجمة': ['traduction', 'interpretation'],
  'دعم': ['assistance informatique', 'assistance'],
  'مرآة': ['miroirs'],
  'درج': ['escaliers'],
  'مكيف مركزي': ['climatisation centralisee'],
  'سخان': ['chauffe eau'],
  'ثلاجة': ['refrigerateur'],
  'غسالة': ['machine a laver'],
  'جلي': ['lave vaisselle'],
  'فرن': ['four'],
  'مواقد': ['plaque de cuisson'],
};

// Strip empty entries and normalise both sides of the bridge.
const ALIASES = new Map<string, string[]>();
for (const [key, values] of Object.entries(RAW_ALIASES)) {
  const normalizedKey = normalizeText(key);
  const normalizedValues = values.map((v) => normalizeText(v)).filter(Boolean);
  if (!normalizedKey || !normalizedValues.length) continue;
  const existing = ALIASES.get(normalizedKey) ?? [];
  ALIASES.set(normalizedKey, Array.from(new Set([...existing, ...normalizedValues])));
}

/** French variants for a normalised Arabic term (empty when unknown). */
export function aliasVariants(term: string): string[] {
  return ALIASES.get(term) ?? [];
}

/** Is `term` a subsequence of `text`? Returns the density (0 when absent). */
function subsequenceDensity(term: string, text: string): number {
  let ti = 0;
  let first = -1;
  let last = -1;
  for (let i = 0; i < text.length && ti < term.length; i += 1) {
    if (text[i] === term[ti]) {
      if (first === -1) first = i;
      last = i;
      ti += 1;
    }
  }
  if (ti < term.length || first === -1) return 0;
  const span = last - first + 1;
  return term.length / span;
}

/** Score a single term against a single field. 0 means "no match". */
function termScore(term: string, field: string): number {
  if (!term || !field) return 0;
  const text = normalizeText(field);
  if (!text) return 0;

  if (text === term) return 100;
  if (text.startsWith(term)) return 88;
  // Word-boundary hit — "plombier" inside "recherche de fuite d'eau plombier".
  if (text.includes(` ${term}`) || text.includes(`${term} `) || text.includes(`-${term}`)) return 76;
  if (text.includes(term)) return 60;

  // Lightweight fuzzy fallback: ordered characters with a tight span.
  const density = subsequenceDensity(term, text);
  if (density >= 0.7) return Math.round(density * 42);
  return 0;
}

/**
 * Score a multi-word query against a set of fields.
 * Returns 0 when nothing matches; higher is better.
 *
 * Each term of the query may carry vocabulary variants (see the Arabic →
 * French bridge above). A term matches when *any* of its variants matches,
 * and its score is the best variant score.
 */
export function matchScore(query: string, fields: (string | undefined | null)[]): number {
  const terms = normalizeText(query).split(' ').filter(Boolean);
  if (!terms.length) return 0;
  const clean = fields.filter((f): f is string => typeof f === 'string' && f.length > 0);
  if (!clean.length) return 0;

  const perTerm = terms.map((term) => {
    const variants = [term, ...aliasVariants(term)];
    let best = 0;
    for (const variant of variants) {
      const score = clean.reduce((b, field) => Math.max(b, termScore(variant, field)), 0);
      if (score > best) best = score;
    }
    return best;
  });

  if (perTerm.every((s) => s > 0)) {
    const average = perTerm.reduce((a, b) => a + b, 0) / perTerm.length;
    return Math.round(average) + 10;
  }
  // Partial match — keep it, but rank it lower.
  const best = Math.max(...perTerm);
  return best > 0 ? Math.round(best * 0.45) : 0;
}

/**
 * Character ranges (in the ORIGINAL string) that match the query.
 * Used to render <mark> highlights without touching the text itself.
 */
export function highlightRanges(text: string, query: string): Array<[number, number]> {
  if (!text) return [];
  const terms = normalizeText(query).split(' ').filter((t) => t.length >= 2);
  if (!terms.length) return [];

  const { text: norm, origin } = normalizeWithMap(text);
  if (!norm || !origin.length) return [];

  const ranges: Array<[number, number]> = [];
  for (const term of terms) {
    let from = 0;
    let guard = 0;
    while (guard < 25) {
      const i = norm.indexOf(term, from);
      if (i === -1) break;
      const lastIdx = Math.min(i + term.length - 1, origin.length - 1);
      ranges.push([origin[i], origin[lastIdx] + 1]);
      from = i + term.length;
      guard += 1;
    }
  }
  if (!ranges.length) return [];

  ranges.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) {
      last[1] = Math.max(last[1], range[1]);
    } else {
      merged.push([range[0], range[1]]);
    }
  }
  return merged;
}
