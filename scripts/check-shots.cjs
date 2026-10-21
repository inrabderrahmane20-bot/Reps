/* Reports the fraction of non-background pixels in each screenshot, so blank
   captures (a crashed dev server) can be told apart from real ones.
   Usage: node scripts/check-shots.cjs [dir] */
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');

const DIR = path.resolve(process.argv[2] || 'screenshots');

/* Minimal PNG decoder: handles the 8-bit RGBA / RGB non-interlaced files
   Playwright writes. Good enough to sample pixels for a blankness check. */
function readPng(file) {
  const buf = fs.readFileSync(file);
  let pos = 8; // skip signature
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + len;
  }
  if (bitDepth !== 8) return { width, height, unsupported: true };
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : 0;
  if (!channels) return { width, height, unsupported: true };
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);
  let rp = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[rp++];
    const row = raw.subarray(rp, rp + stride);
    rp += stride;
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x += 1) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= channels ? prev[x - channels] : 0;
      let v = row[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 0xff;
    }
  }
  return { width, height, channels, pixels: out };
}

function contentRatio(file) {
  const png = readPng(file);
  if (png.unsupported) return { unsupported: true, w: png.width, h: png.height };
  const { width, height, channels, pixels } = png;
  const step = Math.max(1, Math.floor(Math.min(width, height) / 200));
  let sampled = 0;
  let varied = 0;
  const first = [pixels[0], pixels[1], pixels[2]];
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * channels;
      sampled += 1;
      const dr = Math.abs(pixels[i] - first[0]);
      const dg = Math.abs(pixels[i + 1] - first[1]);
      const db = Math.abs(pixels[i + 2] - first[2]);
      if (dr + dg + db > 24) varied += 1;
    }
  }
  return { w: width, h: height, ratio: varied / sampled };
}

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.png')).sort();
const blanks = [];
for (const f of files) {
  const r = contentRatio(path.join(DIR, f));
  if (r.unsupported) {
    console.log(`${f.padEnd(34)} ${r.w}x${r.h}  (unsupported colour type)`);
    continue;
  }
  const pct = (r.ratio * 100).toFixed(1);
  const flag = r.ratio < 0.05 ? '  <-- BLANK' : '';
  if (r.ratio < 0.05) blanks.push(f);
  console.log(`${f.padEnd(34)} ${r.w}x${r.h}  content ${pct}%${flag}`);
}
console.log(`\n${blanks.length} of ${files.length} capture(s) look blank.`);
if (blanks.length) console.log('blank: ' + blanks.join(', '));
