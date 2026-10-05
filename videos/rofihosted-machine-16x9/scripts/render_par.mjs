// Parallel final render: splits the film into N chunks on whole-frame boundaries, renders each with
// `render.mjs --range a,b` in its own browser, joins them losslessly and muxes audio/mix.wav.
// Worth it when frames are expensive (WebGL in a software renderer): 3 chunks ≈ 1.6× faster on 4 cores.
//   node scripts/render_par.mjs [--jobs 3] [--blur 0|1] [--fmt 16x9]
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path';
const ROOT = process.cwd();
const arg = (k, d) => (process.argv.includes('--' + k) ? process.argv[process.argv.indexOf('--' + k) + 1] : d);
const TL = JSON.parse(fs.readFileSync('timeline.json', 'utf8'));
const FMT = arg('fmt', TL.formats[0]), JOBS = +arg('jobs', 3), BLUR = arg('blur', '0'), FPS = TL.fps || 60;
const frames = Math.round(TL.duration * FPS), per = Math.ceil(frames / JOBS);
const cuts = Array.from({ length: JOBS + 1 }, (_, i) => Math.min(frames, i * per) / FPS);
const fmtT = (x) => +x.toFixed(6);
const t0 = Date.now();
const runs = cuts.slice(0, -1).map((a, i) => new Promise((ok, bad) => {
  const b = cuts[i + 1];
  const p = spawn('node', ['scripts/render.mjs', '--fmt', FMT, '--range', `${fmtT(a)},${fmtT(b)}`, '--blur', BLUR], { stdio: ['ignore', 'pipe', 'inherit'] });
  p.stdout.on('data', (d) => process.stdout.write(`[${i}] ${String(d).trim().split('\r').pop()}\n`));
  p.on('close', (c) => (c ? bad(new Error(`chunk ${i} exit ${c}`)) : ok(path.join(ROOT, 'renders', `clip_${FMT}_${fmtT(a)}-${fmtT(b)}.mp4`))));
}));
const clips = await Promise.all(runs);
const list = path.join(ROOT, 'renders', `_concat_${FMT}.txt`);
fs.writeFileSync(list, clips.map((c) => `file '${c}'`).join('\n') + '\n');
const out = path.join(ROOT, 'renders', `${FMT}.mp4`);
const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-i', path.join(ROOT, 'audio/mix.wav'),
  '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-shortest', '-movflags', '+faststart', out], { stdio: 'inherit' });
if (r.status) process.exit(r.status);
fs.unlinkSync(list);
console.log(`wrote ${path.relative(ROOT, out)}  ${frames} frames @ ${FPS} fps from ${JOBS} chunks  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
