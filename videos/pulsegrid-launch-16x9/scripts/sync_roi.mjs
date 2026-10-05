// Sync check per element (complements review.py's whole-frame metric, which reads -2 frames whenever its window
// opens on motion already in progress). For each hit cue it paints 60 fps frames straight from seek(t) around the cue,
// inside the reacting element's region (docs/sync_roi.json), with the cursor layer hidden, and reports:
//   pop / thump / rise   READS: first frame at least half-way from the before image to the settled image
//   click / shutter      ONSET: first frame whose change exceeds half the peak change above the pre-cue baseline
// minus the cue time. The kit's spHit leads visuals so they READ on the beat, which is what this measures.
// Run from the project root:  node scripts/sync_roi.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import zlib from 'node:zlib';
import { createRequire } from 'node:module';
const ROOT = process.cwd(), require = createRequire(path.join(ROOT, 'package.json'));
const { chromium } = require('playwright');
const { cues } = JSON.parse(fs.readFileSync('cues.json', 'utf8'));
// cue "what" → region [x, y, w, h] in 1920×1080 frame px (generous: camera breathing is ≤ 3 %)
const ROI = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/sync_roi.json'), 'utf8'));
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.woff2': 'font/woff2' };
const server = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const b = await chromium.launch({ args: ['--force-color-profile=srgb', '--disable-lcd-text', '--font-render-hinting=none'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await p.goto(`http://127.0.0.1:${server.address().port}/film/index.html?fmt=16x9`);
await p.waitForFunction(() => window.READY); await p.evaluate(() => window.READY);
await p.addStyleTag({ content: '[data-scene="cursor"]{display:none !important}' });
const cdp = await p.context().newCDPSession(p);
async function grab(t, [x, y, w, h]) {
  await p.evaluate((t) => window.seek(t), t);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x, y, width: w, height: h, scale: 0.5 } });
  return decode(Buffer.from(data, 'base64'));
}
function decode(buf) {   // minimal PNG → grey
  let q = 8, w = 0, h = 0, ct = 0; const idat = [];
  while (q < buf.length) { const len = buf.readUInt32BE(q), type = buf.toString('ascii', q + 4, q + 8), d = buf.subarray(q + 8, q + 8 + len);
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; } else if (type === 'IDAT') idat.push(d); q += 12 + len; }
  const bpp = ct === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, cur = Buffer.alloc(stride), prev = Buffer.alloc(stride), out = new Float32Array(w * h);
  for (let yy = 0; yy < h; yy++) { const f = raw[yy * (stride + 1)], row = raw.subarray(yy * (stride + 1) + 1, (yy + 1) * (stride + 1));
    for (let xx = 0; xx < stride; xx++) { const A = xx >= bpp ? cur[xx - bpp] : 0, B = prev[xx], C = xx >= bpp ? prev[xx - bpp] : 0; let v = row[xx];
      if (f === 1) v += A; else if (f === 2) v += B; else if (f === 3) v += (A + B) >> 1; else if (f === 4) { const pp = A + B - C, pa = Math.abs(pp - A), pb = Math.abs(pp - B), pc = Math.abs(pp - C); v += pa <= pb && pa <= pc ? A : pb <= pc ? B : C; } cur[xx] = v & 255; }
    for (let xx = 0; xx < w; xx++) out[yy * w + xx] = (cur[xx * bpp] + cur[xx * bpp + 1] + cur[xx * bpp + 2]) / 3; cur.copy(prev); }
  return out;
}
const rows = [];
for (const c of cues) {
  const roi = ROI[c.what]; if (!roi) continue;
  const F = 60, n0 = Math.round((c.t - 0.2) * F), n1 = Math.round((c.t + 0.15) * F);
  const ims = [];
  for (let n = n0; n <= n1; n++) ims.push([n / F, await grab(n / F, roi)]);
  const dist = (a, b2) => { let d = 0; for (let i = 0; i < a.length; i++) d += Math.abs(a[i] - b2[i]); return d / a.length; };
  let at;
  if (c.type === 'click' || c.type === 'shutter') {
    const e = ims.slice(1).map(([t, im], i) => [t, dist(im, ims[i][1])]);
    const base = Math.min(...e.filter(([t]) => t < c.t - 0.06).map((x) => x[1]));
    const win = e.filter(([t]) => t >= c.t - 0.1), peak = Math.max(...win.map((x) => x[1]));
    at = win.find((x) => x[1] - base >= 0.5 * (peak - base))[0];
  } else {
    const before = (await grab(c.t - 0.3, roi)), after = (await grab(c.t + 0.45, roi)), total = dist(before, after);
    at = (ims.find(([, im]) => dist(im, before) >= 0.5 * total) || [c.t + 0.15])[0];
  }
  rows.push({ t: +c.t.toFixed(3), type: c.type, what: c.what, mode: c.type === 'click' || c.type === 'shutter' ? 'onset' : 'reads', visual_minus_audio_ms: Math.round((at - c.t) * 1000) });
}
for (const r of rows) console.log(`${r.t.toFixed(3)}s  ${r.type.padEnd(7)} ${r.mode.padEnd(5)} ${String(r.visual_minus_audio_ms).padStart(5)} ms  ${r.what}`);
const ok = rows.filter((r) => Math.abs(r.visual_minus_audio_ms) <= 45).length;
console.log(`${ok}/${rows.length} hits within ±45 ms of their sound (60 fps, 16.7 ms resolution); worst ${Math.max(...rows.map((r) => Math.abs(r.visual_minus_audio_ms)))} ms`);
fs.writeFileSync('review/sync_roi.json', JSON.stringify(rows, null, 1));
await b.close(); server.close();
