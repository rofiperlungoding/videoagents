# Score v3 for "The Proof" → audio/music.wav + audio/drums.wav + beats.json (exact grid). Seeded, offline.
#   python3 scripts/score.py
# Direction (user, round 3): "maunya gini", a supplied high-impact SaaS teaser track (refs/target, analysed, not used):
# ~118 BPM, FULL energy from the first frame, no intro, wall-to-wall percussion and sound design (8th-note hits and
# toms, noise bursts, an impact every bar), a dark dissonant cluster instead of chords, loud and flat (LRA 1.3,
# crest 3.4), noisy bright texture. Everything here is original synthesis.
import json, os
import numpy as np, soundfile as sf
from scipy import signal

TL = json.load(open('timeline.json')); M = TL['marks']
SR, BPM, DUR = 48000, float(TL['bpm']), float(TL['duration'])
BEAT = 60 / BPM; S16 = BEAT / 4; N = int(SR * DUR); NB = int(round(DUR / BEAT))
T = lambda b: b * BEAT
rng = np.random.default_rng(int(TL['music'].get('seed', 808)))

def tt(d): return np.arange(int(d * SR)) / SR
def midi(m): return 440 * 2 ** ((m - 69) / 12)
def noise(n): return rng.standard_normal(n)
def filt(x, kind, f, order=2): return signal.sosfilt(signal.butter(order, f, kind, fs=SR, output='sos'), x, axis=0)
def env(t, a=0.003, d=None): e = np.minimum(t / a, 1); return e * np.exp(-t / d) if d else e
def saw(f, t, ph=0.0):
    f = np.broadcast_to(np.asarray(f, float), t.shape)
    p = (np.cumsum(f) / SR + ph) % 1.0; dt = f / SR; y = 2 * p - 1
    m = p < dt; x = p[m] / dt[m]; y[m] -= x + x - x * x - 1
    m = p > 1 - dt; x = (p[m] - 1) / dt[m]; y[m] -= x * x + x + x + 1
    return y
def buf(): return np.zeros((N, 2))
def add(dst, x, t0, gain=1.0, pan=0.0):
    i = int(round(t0 * SR))
    if x.ndim == 1: x = np.stack([x * np.sqrt(1 - pan), x * np.sqrt(1 + pan)], 1)
    if i < 0: x, i = x[-i:], 0
    j = min(N, i + len(x))
    if j > i: dst[i:j] += x[: j - i] * gain
def ir(secs, seed, bright=8000):
    t = tt(secs); r = np.random.default_rng(seed); return filt(r.standard_normal(len(t)) * np.exp(-t * 6.5 / secs), 'lowpass', bright)
def verb(x, secs=1.8, mix=0.25):
    out = []
    for c in range(2):
        h = ir(secs, 31 + c); out.append(signal.fftconvolve(x[:, c], h / np.sqrt((h ** 2).sum()))[:len(x)])
    return np.stack(out, 1) * mix
def widen(x, w):
    m_, s_ = (x[:, 0] + x[:, 1]) / 2, (x[:, 0] - x[:, 1]) / 2 * w; return np.stack([m_ + s_, m_ - s_], 1)
def glue(x, thr_db, ratio, att, rel, makeup_db):
    lvl = np.abs(x).max(1); a_a, a_r = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    e = np.maximum(signal.lfilter([1 - a_r], [1, -a_r], lvl), signal.lfilter([1 - a_a], [1, -a_a], lvl))
    over = np.maximum(0, 20 * np.log10(e + 1e-9) - thr_db)
    return x * (10 ** ((-over * (1 - 1 / ratio) + makeup_db) / 20))[:, None]
def pad(x, n): return np.pad(x, (0, max(0, n - len(x))))[:n]

# ---------------------------------------------------------------- percussion & sound design
def kick(g=1.0, big=False):
    t = tt(0.5 if big else 0.28); f = 48 + (160 if big else 130) * np.exp(-t * 34)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (5 if big else 12))
    knock = filt(noise(len(t)), 'bandpass', [1500, 6000]) * np.exp(-t * 500) * 0.5
    return np.tanh((body + knock) * 1.6) * g
def hit(g=1.0, tone=200):                       # snare/clap/metal hybrid: the 8th-note backbone
    t = tt(0.22)
    body = np.sin(2 * np.pi * np.cumsum(tone + 90 * np.exp(-t * 40)) / SR) * np.exp(-t * 26) * 0.6
    n = filt(noise(len(t)), 'bandpass', [1200, 7000]) * (np.exp(-t * 30) + 0.5 * np.exp(-t * 9)) * 0.9
    metal = sum(np.sin(2 * np.pi * fr * t) for fr in (1430, 2310, 3170)) * np.exp(-t * 45) * 0.08
    return np.tanh((body + n + metal) * 1.7) * g
def tom(m, g=1.0):
    t = tt(0.45); f = midi(m) * (1 + 0.7 * np.exp(-t * 22))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) + filt(noise(len(t)), 'bandpass', [300, 2500]) * np.exp(-t * 35) * 0.5
    return np.tanh(x * 2.0) * g
def hat(g=1.0):
    t = tt(0.06); x = sum(signal.square(2 * np.pi * f * t) for f in (205.3, 304.4, 369.6, 522.7, 540.0, 800.0))
    return filt(filt(x, 'bandpass', [6000, 12000]), 'highpass', 5500) * np.exp(-t * 80) * g * 0.28
def burst(g=1.0, d=0.18, lo=900, hi=9000):     # filtered noise slam
    t = tt(d); return filt(noise(len(t)), 'bandpass', [lo, hi]) * env(t, 0.001, d / 4) * g
def glitch(dur, rate=32, g=1.0, seed=0):        # stuttered retrigger roll, getting louder
    t = tt(dur); r = np.random.default_rng(seed); x = np.zeros_like(t); per = int(SR * BEAT * 4 / rate)
    grain = filt(r.standard_normal(per), 'bandpass', [1500, 8000]) * np.exp(-np.arange(per) / (per / 3))
    for i in range(0, len(t) - per, per): x[i:i + per] += grain * (0.4 + 0.6 * i / len(t))
    return x * g
def boom(g=1.0, d=2.4):
    t = tt(d); f = 30 + 80 * np.exp(-t * 9)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    return np.tanh((s * 1.4 + filt(noise(len(t)), 'lowpass', 800) * np.exp(-t * 7) * 0.7) * 1.6) * g
def impact(g=1.0, big=False):                   # every bar: boom + slam + metal ring
    d = 2.6 if big else 1.6; t = tt(d)
    x = boom(1.0, d) + pad(burst(0.9, 0.35, 600, 10000), len(t))
    ring = sum(np.sin(2 * np.pi * fr * t + k) for k, fr in enumerate((233, 247, 466, 701))) * np.exp(-t * (1.2 if big else 2.5)) * 0.12
    return (x + ring) * g
def braam(m=35, d=3.6, g=1.0):
    t = tt(d)
    x = sum(saw(midi(mm) * (1 + dt), t, ph) for mm in (m, m + 1, m + 12, m + 13) for dt, ph in ((-0.01, 0.0), (0.0, 0.33), (0.01, 0.66)))
    x = filt(x / 12, 'lowpass', 1800)
    return np.tanh(x * 3.5) * np.minimum(t / 0.04, 1) * np.exp(-t * 0.7) * np.clip((d - t) / 0.6, 0, 1) * g
def rev_swell(d, g=1.0):
    t = tt(d); x = (filt(noise(len(t)), 'highpass', 2500) * np.exp(-t * 1.4))[::-1]
    return x * np.linspace(0.05, 1, len(x)) ** 2.5 * g
def riser(d, g=1.0):
    t = tt(d); u = t / d
    x = filt(noise(len(t)), 'bandpass', [600, 9000]) * u ** 2.5
    tone = filt(saw(110 * 2 ** (3 * u), t), 'lowpass', 4000) * u ** 3 * 0.15
    return (x + tone) * g
def bass808(m, d, g=1.0):
    t = tt(d); f = midi(m) * (1 + 0.2 * np.exp(-t * 50))
    x = np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * 1.8)
    return x * np.minimum(t / 0.002, 1) * np.clip((d - t) / 0.03, 0, 1) * g
def cluster(root, d, g=1.0, cut=1400):          # dark dissonant bed: root, +1, +11, +12, slow beating
    t = tt(d); out = []
    for side in (0, 1):
        x = sum(saw(midi(m) * (1 + (0.004 if side else -0.004)), t, side * 0.3) for m in (root, root + 1, root + 11, root + 12))
        out.append(filt(x / 4, 'lowpass', cut))
    e = np.minimum(t / 0.02, 1) * np.clip((d - t) / 0.1, 0, 1)
    return np.stack(out, 1) * e[:, None] * g
def pulse_tick(m, g=1.0):                       # high tense 8th pulse
    t = tt(0.09); return np.sin(2 * np.pi * midi(m) * t) * np.exp(-t * 45) * g * 0.4
def wood_bell(m, g=1.0, d=2.8):
    t = tt(d); f = midi(m); x = np.zeros_like(t)
    for r, a, dc in ((1.0, 1.0, 1.4), (2.76, 0.42, 3.2), (5.40, 0.22, 6.0), (8.93, 0.10, 9.0)):
        x += a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * dc)
    return x * env(t, 0.001) * g * 0.5

# ---------------------------------------------------------------- arrangement (16th slots per bar)
KICK = [0, 3, 8, 11]                            # 1, the "a" of 1, 3, the "a" of 3
HITS = [2, 4, 6, 10, 12, 14]                    # 8th-note backbone, accents on 2 and 4
TOMS = [8, 10, 13, 14]                          # driving second half of the bar
GAP = (M['future'], M['host'])
def energy(bar):                                # flat-out like the target; two short dips for the story
    if bar in (20, 21): return 'mid'            # "Close the tab / It keeps working"
    if bar in (22, 23): return 'thin'           # "And… it remembers you"
    if bar >= 28: return 'end'
    return 'full'

kk, dr, bs, fx, bed, tx = buf(), buf(), buf(), buf(), buf(), buf()
kicks = []
NBAR = int(np.ceil(NB / 4))
for bar in range(1, NBAR + 1):
    b0 = (bar - 1) * 4; e = energy(bar)
    root = [35, 35, 36, 34][(bar - 1) % 4]      # B1, B1, C2, Bb1: the cluster walks a semitone
    if e != 'end':
        add(bed, cluster(root + 12, 4 * BEAT, 0.5 if e != 'thin' else 0.7, 1400 if e == 'full' else 900), T(b0))
        for s in range(8): add(tx, pulse_tick(83 if s % 2 else 78, 0.5 if e != 'thin' else 0.7), T(b0) + s * 2 * S16, pan=0.5 if s % 2 else -0.5)
    if e in ('full', 'mid'):
        ks = KICK if e == 'full' else [0, 8]
        for i, sl in enumerate(ks):
            add(kk, kick(1.0), T(b0) + sl * S16); kicks.append(T(b0) + sl * S16)
            nxt = (ks[i + 1] if i + 1 < len(ks) else 16) - sl
            add(bs, bass808(root + 12 if bar % 2 == 0 and i == len(ks) - 1 else root, nxt * S16 * 0.9, 0.62), T(b0) + sl * S16)
        for sl in (HITS if e == 'full' else [4, 12]):
            acc = sl in (4, 12)
            add(dr, hit(0.75 if acc else 0.38, 210 if acc else 260), T(b0) + sl * S16, pan=0.0 if acc else (0.35 if sl % 4 else -0.35))
        if e == 'full':
            for j, sl in enumerate(TOMS): add(dr, tom([45, 43, 40, 38][j], 0.7), T(b0) + sl * S16, pan=0.4 - 0.25 * j)
        for sl in range(1, 16, 2): add(dr, hat(0.45), T(b0) + sl * S16, pan=0.3)
        for sl in (4, 12): add(dr, burst(0.3, 0.12), T(b0) + sl * S16, pan=-0.3)
        add(fx, impact(0.8 if bar % 4 == 1 else 0.55, big=bar % 4 == 1), T(b0))   # an impact every bar, bigger every 4
        if bar % 4 == 0 and bar < 26: add(fx, glitch(BEAT, 32, 0.35, bar), T(b0 + 3))
        if bar % 4 == 0: add(fx, rev_swell(BEAT * 2, 0.35), T(b0 + 2))
    if e == 'thin':                             # still tense: boom on 1, ticking, low pulse
        add(fx, impact(0.6), T(b0))
        add(bs, bass808(root + 12, BEAT * 2, 0.6), T(b0)); add(bs, bass808(root + 12, BEAT * 2, 0.45), T(b0 + 2))
        for sl in range(0, 16, 2): add(dr, hat(0.3), T(b0) + sl * S16, pan=0.3)
        if bar == 23: add(fx, riser(BEAT * 4, 0.45), T(b0))
    if e == 'end':
        add(bed, cluster(47, DUR - T(b0), 0.35, 700), T(b0))

# set pieces
add(fx, impact(0.9, big=True), 0.0)                                            # frame 0 already hits (no intro)
add(fx, rev_swell(1.2, 0.5), T(M['meet']) - 1.2)
add(fx, impact(1.0, big=True), T(M['meet'])); add(fx, braam(35, 3.4, 0.7), T(M['meet']))
add(kk, kick(1.25, True), T(M['meet'])); kicks.append(T(M['meet']))
add(fx, riser(T(M['no1']) - T(M['we']), 0.5), T(M['we']))
add(fx, rev_swell(1.0, 0.6), T(M['host']) - 1.0)
add(fx, braam(35, 4.0, 1.0), T(M['host'])); add(fx, impact(1.0, big=True), T(M['host']))
add(kk, kick(1.35, True), T(M['host'])); kicks.append(T(M['host']))
for j, m in enumerate((71, 78, 83)): add(fx, wood_bell(m, 0.45 - 0.08 * j), T(M['logo_mark']) + j * 0.1, pan=(j - 1) * 0.3)
add(fx, wood_bell(76, 0.45), T(M['notif']), pan=0.2); add(fx, wood_bell(76, 0.35), T(M['v3']), pan=-0.2)
add(fx, wood_bell(71, 0.5), T(M['tagline_from']))

# ---------------------------------------------------------------- mix + master
duck = np.ones(N); L = int(0.3 * SR)
for k0 in kicks:
    i = int(k0 * SR); ee = 1 - 0.5 * np.exp(-np.arange(L) / (0.06 * SR)); seg = duck[i:i + L]; seg[:] = np.minimum(seg, ee[:len(seg)])
bs = filt(bs, 'highpass', 32) * (0.4 + 0.6 * duck)[:, None]; bed *= (0.35 + 0.65 * duck)[:, None]
dr = widen(dr, 1.4); bed = widen(bed, 1.6); fx = widen(fx, 1.3)
wet = widen(verb(dr * 0.5 + fx * 0.8 + tx + bed * 0.3, 1.6, 0.22), 1.5)
drums = glue(kk * 1.4 + dr * 1.35, -12, 2.0, 0.008, 0.09, 1)
music = drums + bs * 0.85 + fx * 0.85 + bed * 0.55 + tx * 0.5 + wet
music = filt(music, 'highpass', 28)
music = glue(music, -9, 1.4, 0.015, 0.2, 0)
music = np.tanh(music * 0.6) / np.tanh(0.6)
g0, g1 = int(T(GAP[0]) * SR), int(T(GAP[1]) * SR)
music[g0:g1] *= np.linspace(1, 0.1, g1 - g0)[:, None] ** 2
fade = int(0.3 * SR); music[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 2
music /= np.abs(music).max() / 10 ** (-1 / 20)
stem = kk / (np.abs(kk).max() / 10 ** (-1 / 20))
os.makedirs('audio', exist_ok=True)
json.dump({'bpm': BPM, 'beat': BEAT, 'offset': 0.0, 'beats': [round(T(b), 5) for b in range(NB + 1)],
           'downbeats': [round(T(b), 5) for b in range(0, NB + 1, 4)],
           'hits': [{'t': round(k0, 5), 's': 1.0} for k0 in sorted(set(round(k, 5) for k in kicks))],
           'source': 'scripts/score.py (exact grid, not measured)'}, open('beats.json', 'w'))
sf.write('audio/music.wav', music.astype(np.float32), SR, subtype='FLOAT')
sf.write('audio/drums.wav', stem.astype(np.float32), SR, subtype='FLOAT')
y = music.mean(1)[int(2 * SR):int(22 * SR)]
print(f'audio/music.wav  {DUR}s  {BPM:g} BPM  {NB} beats  host {T(M["host"]):.2f}s  crest(2-22s) {np.abs(y).max() / np.sqrt(np.mean(y ** 2)):.2f}')
