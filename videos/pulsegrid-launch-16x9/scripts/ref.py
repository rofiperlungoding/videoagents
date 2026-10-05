# Watch a reference ad so the film can follow it closely. Run from the project root:
#   python3 scripts/ref.py <youtube/vimeo/x url | path/to/video.mp4> [--name apple-ad] [--bpm 120] [--duration 20]
# Our timeline defaults to the reference's own length and measured tempo (follow it closely); --duration / --bpm
# map it onto a different length or tempo instead (shot lengths scale proportionally).
#
# Writes refs/<name>/ (git-ignored: it is someone else's footage, keep it local):
#   source.mp4            720p working copy
#   shots/sNN.jpg         one keyframe per shot (middle), plus sNN_in.jpg / sNN_out.jpg (first / last frame)
#   contact_shots.jpg     every shot keyframe with number, time and length   ← LOOK at this first
#   contact_2fps.jpg      the whole ad at 2 fps                               ← then this
#   analysis.json         cuts, shots (length, palette, brightness, motion), audio (tempo, beats, energy), cut grammar
#   shots.md              the measured shot table, human readable
#   reference_map.md      shot-by-shot template: what the reference does → our product's version, with beats
#   timeline_marks.json   suggested marks + music sections on OUR beat grid, to merge into timeline.json
#   audio.wav             the reference audio (timing study only; never ship it unless the user owns the rights)
#
# The agent then LOOKS at the contact sheets and shot frames, fills in "what it does" (type, motion, transition,
# camera, text) for every shot, writes docs/style_guide.md from it, and builds the shotlist from reference_map.md.
import json, os, re, shutil, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

args = sys.argv[1:]
def opt(k, d=None):
    if f'--{k}' in args:
        i = args.index(f'--{k}'); v = args[i + 1]; del args[i:i + 2]; return v
    return d
NAME, BPM_OVERRIDE, DUR_OVERRIDE, THR = opt('name'), opt('bpm'), opt('duration'), float(opt('threshold', '0.3'))
if not args: raise SystemExit(__doc__ if __doc__ else 'usage: python3 scripts/ref.py <url|file> [--name x]')
SRC = args[0]
is_url = bool(re.match(r'^https?://', SRC))
if not NAME:
    NAME = re.sub(r'[^a-z0-9]+', '-', (os.path.splitext(os.path.basename(SRC))[0] if not is_url else SRC.split('/')[-1].split('?v=')[-1]).lower()).strip('-')[:40] or 'ref'
OUT = os.path.join('refs', NAME); os.makedirs(os.path.join(OUT, 'shots'), exist_ok=True)
TL = json.load(open('timeline.json')) if os.path.exists('timeline.json') else {}

def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode: raise SystemExit(f'{cmd[0]} failed:\n{r.stderr[-1500:]}')
    return r

# ---------------------------------------------------------------- 1. acquire
raw = os.path.join(OUT, 'download.mp4')
if is_url:
    if not shutil.which('yt-dlp'):
        raise SystemExit('yt-dlp is not installed: pip install yt-dlp   (or download the video yourself and pass the file path)')
    cmd = ['yt-dlp', '-f', 'bv*[height<=1080]+ba/b[height<=1080]/b', '--merge-output-format', 'mp4', '-o', raw, '--no-playlist']
    if shutil.which('node'): cmd += ['--js-runtimes', 'node']
    r = subprocess.run(cmd + [SRC], capture_output=True, text=True)
    if r.returncode or not os.path.exists(raw):
        raise SystemExit('Could not download the reference (network block, login wall or bot check).\n'
                         'Download it yourself (browser, yt-dlp on your machine, screen recording) and run:\n'
                         f'  python3 scripts/ref.py path/to/video.mp4 --name {NAME}\n\n' + r.stderr[-800:])
else:
    if not os.path.exists(SRC): raise SystemExit(f'no such file: {SRC}')
    raw = SRC
src = os.path.join(OUT, 'source.mp4')
run(['ffmpeg', '-y', '-v', 'error', '-i', raw, '-vf', 'scale=-2:720', '-c:v', 'libx264', '-crf', '20', '-preset', 'veryfast', '-c:a', 'aac', '-b:a', '192k', src])
if is_url and os.path.exists(raw): os.remove(raw)

pr = json.loads(run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,width,height,r_frame_rate:format=duration', '-of', 'json', src]).stdout)
vs = next(s for s in pr['streams'] if s['codec_type'] == 'video')
has_audio = any(s['codec_type'] == 'audio' for s in pr['streams'])
W, H = int(vs['width']), int(vs['height']); n, d = map(int, vs['r_frame_rate'].split('/')); FPS = n / d
DUR = float(pr['format']['duration'])
aspect = '16x9' if W / H > 1.5 else '9x16' if H / W > 1.5 else '4x5' if H > W else '1x1'

# ---------------------------------------------------------------- 2. frames at up to 30 fps (grey, small) → cuts + motion
AF = min(30, round(FPS))
def frames(path, w, fps, gray=True):
    h = int(round(w * H / W / 2) * 2)
    rawb = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vf', f'fps={fps},scale={w}:{h}:flags=area', '-f', 'rawvideo', '-pix_fmt', 'gray' if gray else 'rgb24', '-'], capture_output=True).stdout
    a = np.frombuffer(rawb, np.uint8)
    return a.reshape(-1, h, w) if gray else a.reshape(-1, h, w, 3)
g = frames(src, 160, AF).astype(np.float32)
diff = np.abs(np.diff(g, axis=0)).mean(axis=(1, 2)) / 255          # motion energy between samples
hist = np.array([np.histogram(f, bins=32, range=(0, 255))[0] / f.size for f in g])
hdist = np.abs(np.diff(hist, axis=0)).sum(1) / 2                     # histogram change (cuts change the histogram)

# A hard cut is a one-frame spike: the change across it dwarfs the change on the frames either side.
# Morphs, pushes and kinetic type change gradually over several frames, so they never pass the ratio test.
cuts = []
for i in range(len(diff)):
    before = [diff[j] for j in (i - 2, i - 1) if j >= 0] or [0]
    after = [diff[j] for j in (i + 1, i + 2) if j < len(diff)] or [0]
    # a cut leaps out of what came before (still or steady), and is bigger than what follows (which may be moving)
    if diff[i] > 0.025 and diff[i] > 3.5 * max(max(before), 0.002) and diff[i] > 1.6 * max(after):
        cuts.append(round((i + 1) / AF, 3))
# ffmpeg's scene score adds precise cut times for high-contrast cuts
sc = subprocess.run(['ffmpeg', '-v', 'info', '-i', src, '-vf', f"select='gt(scene,{THR})',showinfo", '-f', 'null', '-'], capture_output=True, text=True).stderr
for m in re.findall(r'pts_time:([\d.]+)', sc):
    t = round(float(m), 3)
    cuts = [c for c in cuts if abs(c - t) > 1.5 / AF] + [t]
cuts = [c for c in sorted(cuts) if 0.15 < c < DUR - 0.15]
merged = []
for c in cuts:
    if not merged or c - merged[-1] > 0.2: merged.append(c)
cuts = merged
bounds = [0.0] + cuts + [DUR]

# events: motion peaks inside shots (morphs, pops, kinetic type) — motion-graphics ads change without cutting
thr = max(0.004, 2.5 * float(np.median(diff)))
events = [round((i + 1) / AF, 2) for i in range(1, len(diff) - 1) if diff[i] > thr and diff[i] >= diff[i - 1] and diff[i] >= diff[i + 1]]

# ---------------------------------------------------------------- 3. audio: tempo, beats, energy
audio = None
if has_audio:
    wav = os.path.join(OUT, 'audio.wav')
    run(['ffmpeg', '-y', '-v', 'error', '-i', src, '-ac', '1', '-ar', '22050', wav])
    try:
        import librosa
        y, sr = librosa.load(wav, sr=None, mono=True)
        tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units='time', start_bpm=float(BPM_OVERRIDE or TL.get('bpm', 120)))
        tempo = float(np.atleast_1d(tempo)[0])
        rms = librosa.feature.rms(y=y, hop_length=sr // 10)[0]       # 10 Hz
        rmsdb = 20 * np.log10(rms + 1e-6)
        onsets = librosa.onset.onset_detect(y=y, sr=sr, units='time')
        per_sec = [round(float(rmsdb[int(s * 10):int(s * 10) + 10].mean()), 1) for s in range(int(DUR))]
        audio = {'tempo_bpm': round(tempo, 2), 'beats': [round(float(b), 3) for b in beats], 'onsets_per_sec': round(len(onsets) / DUR, 2),
                 'loudness_db_per_sec': per_sec, 'silent': float(rmsdb.max()) < -50}
    except Exception as e:
        audio = {'error': f'audio analysis failed: {e}'}

# ---------------------------------------------------------------- 4. per shot: keyframes, palette, brightness, motion
rgb = frames(src, 320, 4, gray=False)
def at(t):  # rgb frame nearest to t (4 fps sampling) → full-res still for the agent
    path = None
    return rgb[min(len(rgb) - 1, int(t * 4))]
def still(t, path):
    run(['ffmpeg', '-y', '-v', 'error', '-ss', f'{max(0, t):.3f}', '-i', src, '-frames:v', '1', '-q:v', '3', path])
def palette(img, k=5):
    q = Image.fromarray(img).quantize(colors=k, method=Image.Quantize.MEDIANCUT)
    pal, counts = q.getpalette()[:k * 3], sorted(q.getcolors(), reverse=True)
    return [{'hex': '#%02X%02X%02X' % tuple(pal[i * 3:i * 3 + 3]), 'share': round(c / (img.shape[0] * img.shape[1]), 2)} for c, i in counts[:k]]
beats = (audio or {}).get('beats') or []
period = 60 / ((audio or {}).get('tempo_bpm') or float(BPM_OVERRIDE or TL.get('bpm', 120)))
def nearest_beat(t):
    if not beats: return None
    i = int(np.argmin([abs(t - b) for b in beats])); return i, round((t - beats[i]) * 1000)
shots = []
for k in range(len(bounds) - 1):
    a, b = bounds[k], bounds[k + 1]; mid = (a + b) / 2
    still(mid, os.path.join(OUT, 'shots', f's{k + 1:02d}.jpg'))
    still(a + 0.04, os.path.join(OUT, 'shots', f's{k + 1:02d}_in.jpg'))
    still(max(a, b - 0.08), os.path.join(OUT, 'shots', f's{k + 1:02d}_out.jpg'))
    i0, i1 = int(a * AF), max(int(a * AF) + 1, int(b * AF) - 1)
    m = float(diff[i0:i1].mean()) if i1 > i0 else 0.0
    img = at(mid)
    shots.append({'shot': k + 1, 'in': round(a, 3), 'out': round(b, 3), 'length': round(b - a, 3),
                  'length_beats': round((b - a) / period, 2), 'cut_on_beat': nearest_beat(a) if k else None,
                  'motion': round(m * 1000, 1), 'pace': 'static' if m < 0.004 else 'calm' if m < 0.012 else 'busy' if m < 0.035 else 'frantic',
                  'brightness': round(float(img.mean()) / 255, 2), 'palette': palette(img),
                  'events_inside': [e for e in events if a < e < b]})

# cut grammar: how cuts sit on the music
grammar = {}
if beats and cuts:
    offs = [abs(nearest_beat(c)[1]) for c in cuts]
    grammar = {'cuts_within_60ms_of_a_beat': f'{sum(o <= 60 for o in offs)}/{len(offs)}',
               'median_shot_beats': round(float(np.median([s['length_beats'] for s in shots])), 2)}
lengths = [s['length'] for s in shots]

# ---------------------------------------------------------------- 5. contact sheets
try: FONT = ImageFont.truetype('DejaVuSans.ttf', 16)
except Exception:
    try: FONT = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 16)
    except Exception: FONT = ImageFont.load_default()
def tile(paths, labels, out, tw, cols):
    ims = [Image.open(p).convert('RGB') for p in paths]
    th = int(tw * ims[0].height / ims[0].width); pad, lab = 6, 24; rows = (len(ims) + cols - 1) // cols
    S = Image.new('RGB', (cols * (tw + pad) + pad, rows * (th + lab + pad) + pad), (18, 18, 18)); dr = ImageDraw.Draw(S)
    for i, (im, l) in enumerate(zip(ims, labels)):
        x, y = pad + (i % cols) * (tw + pad), pad + (i // cols) * (th + lab + pad)
        S.paste(im.resize((tw, th)), (x, y + lab)); dr.text((x + 3, y + 4), l, fill=(235, 235, 235), font=FONT)
    S.save(out, quality=88)
wide = W >= H
tile([os.path.join(OUT, 'shots', f's{s["shot"]:02d}.jpg') for s in shots],
     [f'#{s["shot"]} {s["in"]:.2f}s  {s["length"]:.2f}s  {s["pace"]}' for s in shots],
     os.path.join(OUT, 'contact_shots.jpg'), 360 if wide else 200, 5 if wide else 8)
tmp = os.path.join(OUT, '_2fps'); os.makedirs(tmp, exist_ok=True)
run(['ffmpeg', '-y', '-v', 'error', '-i', src, '-vf', 'fps=2,scale=320:-2', os.path.join(tmp, 'f%04d.jpg')])
fs = sorted(os.listdir(tmp))
tile([os.path.join(tmp, f) for f in fs], [f'{i / 2:.1f}s' for i in range(len(fs))], os.path.join(OUT, 'contact_2fps.jpg'), 240 if wide else 140, 8 if wide else 12)
shutil.rmtree(tmp)

# ---------------------------------------------------------------- 6. map onto OUR beat grid
ref_bpm = (audio or {}).get('tempo_bpm') if audio and not audio.get('silent') else None
OUR_BPM = float(BPM_OVERRIDE or ref_bpm or TL.get('bpm') or 120)
OUR_DUR = float(DUR_OVERRIDE or round(DUR * 2) / 2)
scale = OUR_DUR / DUR                                                 # stretch/squeeze the reference to our duration
q = lambda t: round(t * scale / (60 / OUR_BPM) * 2) / 2               # seconds → our beats, snapped to half-beats
marks = {f'shot{s["shot"]:02d}': q(s['in']) for s in shots}
marks['done'] = q(DUR)
for k, e in enumerate(events): marks.setdefault(f'ev{k + 1:02d}', q(e))
sections = []
if audio and audio.get('loudness_db_per_sec'):
    L = np.array(audio['loudness_db_per_sec']); lo, hi = np.percentile(L, 25), np.percentile(L, 75); prev = None
    for s, v in enumerate(L):
        kind = 'intro' if v < lo else 'full' if v > hi else 'dark'
        if s and L[s] - L[s - 1] > 8: kind = 'drop'
        if kind != prev: sections.append({'at': q(s), 'kind': kind}); prev = kind
json.dump({'note': f'Reference {NAME} mapped onto {OUR_BPM:g} BPM, {OUR_DUR:g}s (scale {scale:.3f}). Merge what you keep into timeline.json (set bpm and duration to these) marks / music.sections.',
           'bpm': round(OUR_BPM, 2), 'duration': OUR_DUR,
           'marks': marks, 'music_sections': sections}, open(os.path.join(OUT, 'timeline_marks.json'), 'w'), indent=1)

A = {'source': SRC, 'name': NAME, 'width': W, 'height': H, 'aspect': aspect, 'fps': round(FPS, 3), 'duration': round(DUR, 3),
     'cuts': cuts, 'shots': shots, 'events': events, 'audio': audio, 'cut_grammar': grammar,
     'rhythm': {'shots': len(shots), 'mean_shot_s': round(float(np.mean(lengths)), 2), 'shortest_s': round(min(lengths), 2), 'longest_s': round(max(lengths), 2),
                'events_per_sec': round(len(events) / DUR, 2)}}
json.dump(A, open(os.path.join(OUT, 'analysis.json'), 'w'), indent=1)

# ---------------------------------------------------------------- 7. human/agent-readable tables
au = audio or {}
head = [f'# Reference: {NAME}', '', f'Source: `{SRC}` · {W}×{H} ({aspect}) · {DUR:.2f}s · {FPS:.0f} fps',
        f'Shots: {len(shots)} · mean {A["rhythm"]["mean_shot_s"]}s (shortest {A["rhythm"]["shortest_s"]}s, longest {A["rhythm"]["longest_s"]}s) · motion events {A["rhythm"]["events_per_sec"]}/s',
        f'Music: {au.get("tempo_bpm", "n/a")} BPM · onsets {au.get("onsets_per_sec", "n/a")}/s' + (f' · cuts on a beat {grammar["cuts_within_60ms_of_a_beat"]}' if grammar else ''), '']
rows = ['| # | in–out (s) | length | beats | pace | brightness | palette (top 3) | cut vs beat |', '|---|---|---|---|---|---|---|---|']
for s in shots:
    cb = s['cut_on_beat']; cbs = '—' if not cb else f'{cb[1]:+d} ms'
    rows.append(f'| {s["shot"]} | {s["in"]:.2f}–{s["out"]:.2f} | {s["length"]:.2f}s | {s["length_beats"]} | {s["pace"]} | {s["brightness"]} | '
                + ' '.join(p['hex'] for p in s['palette'][:3]) + f' | {cbs} |')
open(os.path.join(OUT, 'shots.md'), 'w').write('\n'.join(head + rows) + '\n')

mp = head + ['# Reference map: follow it closely, make it ours', '',
    'Fill every row after LOOKING at `contact_shots.jpg` and `shots/sNN_in.jpg / sNN.jpg / sNN_out.jpg`.',
    'Keep: shot lengths, order of beats, transitions, camera, type behaviour, pacing, colour *roles*.',
    'Swap: every word, image, logo, UI, product and the palette (map their colours onto our brand tokens).',
    'Never copy: footage, logos, characters, copy, music. Their audio is for timing only.', '',
    f'Our timeline: {OUR_BPM:g} BPM, {OUR_DUR:g}s. Suggested marks: `timeline_marks.json` (half-beat snapped).', '',
    '| # | ref in (s) | our beat | Reference does (type, motion, transition, camera, text) | Our version (our product, our words) | Colour role → our token |',
    '|---|---|---|---|---|---|']
for s in shots:
    mp.append(f'| {s["shot"]} | {s["in"]:.2f} | b{q(s["in"])} | ? | ? | {s["palette"][0]["hex"]} → ? |')
mp += ['', '## Their grammar in one paragraph', '?', '', '## Personalisation (what changes for our product, and why)', '?']
open(os.path.join(OUT, 'reference_map.md'), 'w').write('\n'.join(mp) + '\n')

print(f'{OUT}/  {W}x{H} {aspect}  {DUR:.2f}s  {len(shots)} shots (mean {A["rhythm"]["mean_shot_s"]}s)  events {len(events)}'
      + (f'  music {au.get("tempo_bpm")} BPM' if au.get('tempo_bpm') else '  (no audio)'))
print(f'next: LOOK at {OUT}/contact_shots.jpg and {OUT}/contact_2fps.jpg, then fill {OUT}/reference_map.md')
