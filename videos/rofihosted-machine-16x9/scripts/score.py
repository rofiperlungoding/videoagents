# Score for "The Machine" → audio/music.wav + audio/drums.wav + beats.json (exact grid). Seeded, offline.
#   python3 scripts/score.py
# Apple-product-film shape: a lone felt-piano motif over the macro hardware shots, a pulse joins, a string swell and
# riser into the drop on "a real server." (bar 9), a warm full groove under the system, a night breakdown (piano +
# pad), a morning lift, four hits for the climax lines, one silent beat, a big open final chord with the brand's
# wooden bell. 96 BPM, B minor (Bm–G–D–A), 24 bars = 60 s. Instruments are shared with the 9:16 film's score v1.
import json, os
import numpy as np, soundfile as sf
from scipy import signal

TL = json.load(open('timeline.json')); M = TL['marks']
SR, BPM, DUR = 48000, float(TL['bpm']), float(TL['duration'])
BEAT = 60 / BPM; N = int(SR * DUR); NB = int(round(DUR / BEAT))
T = lambda b: b * BEAT
bar_of = lambda b: int(b // 4) + 1                      # 1-based bar
rng = np.random.default_rng(int(TL['music'].get('seed', 808)))

def tt(d): return np.arange(int(d * SR)) / SR
def midi(m): return 440 * 2 ** ((m - 69) / 12)
def noise(n): return rng.standard_normal(n)
def filt(x, kind, f, order=2): return signal.sosfilt(signal.butter(order, f, kind, fs=SR, output='sos'), x, axis=0)
def env(t, a=0.005, d=None, r=0.05, dur=None):
    e = np.minimum(t / max(a, 1e-4), 1)
    if d is not None: e = e * np.exp(-t / d)
    if dur is not None: e = e * np.clip((dur - t) / r, 0, 1)
    return e
def saw(f, t, phase=0.0):                                # polyBLEP band-limited saw
    p = (f * t + phase) % 1.0; dt = f / SR; y = 2 * p - 1
    m = p < dt; x = p[m] / dt; y[m] -= x + x - x * x - 1
    m = p > 1 - dt; x = (p[m] - 1) / dt; y[m] -= x * x + x + x + 1
    return y
def sweep_lp(x, f0, f1, curve=2.0, block=256):            # time-varying low-pass, block-wise
    out = np.zeros_like(x); zi = None; n = len(x)
    for i in range(0, n, block):
        u = (i / max(1, n - 1)) ** curve; fc = f0 * (f1 / f0) ** u
        sos = signal.butter(2, min(fc, SR * 0.45), 'lowpass', fs=SR, output='sos')
        if zi is None: zi = np.zeros((sos.shape[0], 2))
        out[i:i + block], zi = signal.sosfilt(sos, x[i:i + block], zi=zi)
    return out

def buf(): return np.zeros((N, 2))
def add(dst, x, t0, gain=1.0, pan=0.0):
    i = int(round(t0 * SR))
    if x.ndim == 1: x = np.stack([x * np.sqrt(0.5 * (1 - pan)), x * np.sqrt(0.5 * (1 + pan))], 1) * np.sqrt(2)
    if i < 0: x, i = x[-i:], 0
    j = min(N, i + len(x))
    if j > i: dst[i:j] += x[: j - i] * gain

# ---------------------------------------------------------------- instruments
def kick(g=1.0, big=False):
    t = tt(0.6 if big else 0.35)
    f = 52 + (140 if big else 110) * np.exp(-t * 30)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (4.5 if big else 10))
    click = filt(noise(len(t)), 'highpass', 2500) * np.exp(-t * 900) * 0.3
    return np.tanh((body + click) * 1.6) * g
def clap(g=1.0):
    t = tt(0.3); n = filt(noise(len(t)), 'bandpass', [900, 4000])
    e = sum(np.where(t >= o, np.exp(-(t - o) * 300), 0) for o in (0, 0.009, 0.019)) + np.where(t >= 0.022, np.exp(-(t - 0.022) * 18) * 0.55, 0)
    return n * e * g
def hat(g=1.0, open_=False):
    t = tt(0.25 if open_ else 0.045)
    x = sum(signal.square(2 * np.pi * f * t) for f in (205.3, 304.4, 369.6, 522.7, 540.0, 800.0))
    return filt(filt(x, 'bandpass', [7000, 13000]), 'highpass', 6000) * np.exp(-t * (14 if open_ else 110)) * g * 0.3
def snare(g=1.0):
    t = tt(0.22); tone = np.sin(2 * np.pi * (185 + 40 * np.exp(-t * 40)) * t) * np.exp(-t * 28)
    return (tone * 0.6 + filt(noise(len(t)), 'highpass', 1800) * np.exp(-t * 20) * 0.8) * g
def crash(g=1.0, d=2.6):
    t = tt(d); x = filt(noise(len(t)), 'highpass', 3800) + 0.3 * filt(noise(len(t)), 'bandpass', [5000, 9000])
    return x * np.exp(-t * 1.9) * env(t, 0.002) * g
def pluck_bass(m, d=0.22, g=1.0, bright=1.0):
    t = tt(d); f = midi(m)
    x = 0.65 * saw(f, t) + 0.35 * signal.square(2 * np.pi * f * t, 0.5) * 0.5 + 0.8 * np.sin(2 * np.pi * f * t)
    x = sweep_lp(x, 2400 * bright, 220, curve=0.35)
    return np.tanh(x * 1.5) * env(t, 0.003, None, 0.03, d) * g
def sub(m, d, g=1.0, swell=0.3):
    t = tt(d); f = midi(m)
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
    return x * np.minimum(t / swell, 1) * np.clip((d - t) / 0.4, 0, 1) * g
def arp(m, d=0.12, g=1.0, cut=2600):                     # Reznor-ish pulse: two detuned saws, short, filtered
    t = tt(d + 0.08); f = midi(m)
    x = saw(f * 1.003, t) + saw(f * 0.997, t, 0.37)
    x = sweep_lp(x, cut, cut * 0.35, curve=0.5)
    return x * env(t, 0.002, 0.09) * g * 0.35
def stab(ms, d=0.5, g=1.0, cut=3200):
    t = tt(d)
    x = sum(saw(midi(m) * (1 + dt), t, ph) for m in ms for dt, ph in ((-0.006, 0.1), (0.0, 0.5), (0.006, 0.8)))
    x = sweep_lp(x / (3 * len(ms)), cut, 400, curve=0.6)
    return x * env(t, 0.004, 0.22, 0.05, d) * g
def stab_st(ms, d=0.5, g=1.0, cut=3600):                 # true stereo: different detune per side
    t = tt(d); out = []
    for side, sh in ((0, -1), (1, 1)):
        x = sum(saw(midi(m) * (1 + sh * dt), t, ph + side * 0.31) for m in ms for dt, ph in ((0.004, 0.1), (0.011, 0.5)))
        out.append(sweep_lp(x / (2 * len(ms)), cut, 500, curve=0.6) * env(t, 0.004, 0.25, 0.05, d))
    return np.stack(out, 1) * g
def lead(m, d=0.3, g=1.0):                               # bright pluck lead: saw + square, fast filter decay
    t = tt(d + 0.15); f = midi(m)
    x = 0.6 * saw(f, t) + 0.4 * signal.square(2 * np.pi * f * t, 0.3)
    x = sweep_lp(x, 7000, 900, curve=0.4)
    return x * env(t, 0.002, 0.16) * g * 0.4
def shaker(g=1.0):
    t = tt(0.06); return filt(noise(len(t)), 'bandpass', [5000, 11000]) * np.exp(-t * 70) * env(t, 0.004) * g
def piano(m, d=2.5, g=1.0, vel=1.0):                    # additive piano: inharmonic partials, per-partial decay, hammer
    t = tt(d); f = midi(m); B = 0.0004; x = np.zeros_like(t)
    for k in range(1, 12):
        fk = k * f * np.sqrt(1 + B * k * k)
        if fk > SR / 2.2: break
        amp = (1 / k ** 1.15) * (0.6 + 0.4 * vel) ** (k / 3)
        x += amp * np.sin(2 * np.pi * fk * t + k) * np.exp(-t * (0.9 + 0.55 * k) * (1.2 if m > 72 else 1))
    ham = filt(noise(len(t)), 'bandpass', [800, 4000]) * np.exp(-t * 180) * 0.05
    return (x * 0.42 + ham) * env(t, 0.002, None, 0.3, d) * g * vel
def pad(ms, d, g=1.0):
    t = tt(d)
    x = sum(saw(midi(m) * (1 + dt), t, ph) for m in ms for dt, ph in ((-0.008, 0.2), (0.0, 0.6), (0.008, 0.9)))
    x = filt(x / (3 * len(ms)), 'lowpass', 1100)
    return x * np.minimum(t / 0.9, 1) * np.clip((d - t) / 1.2, 0, 1) * g
def boom(g=1.0):                                         # cinematic impact: sub drop + body + air
    t = tt(3.0); f = 32 + 70 * np.exp(-t * 9)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    body = filt(noise(len(t)), 'lowpass', 900) * np.exp(-t * 7) * 0.6
    return np.tanh((s * 1.3 + body) * 1.4) * g
def braam(m=33, d=3.4, g=1.0):                           # low brass-like wall: detuned saws, opening filter, drive
    t = tt(d)
    x = sum(saw(midi(mm) * (1 + dt), t, ph) for mm in (m, m + 12, m + 19) for dt, ph in ((-0.01, 0.0), (0.0, 0.33), (0.011, 0.66)))
    x = sweep_lp(x / 9, 180, 2600, curve=0.5)
    x = np.tanh(x * 3.0) * np.minimum(t / 0.06, 1) * np.exp(-t * 0.7) * np.clip((d - t) / 0.6, 0, 1)
    return x * g
def riser(d, g=1.0):
    t = tt(d); u = t / d
    x = sweep_lp(filt(noise(len(t)), 'highpass', 300), 400, 9000, curve=2.2) * u ** 2.4
    tone = np.sin(2 * np.pi * np.cumsum(180 * 2 ** (3 * u)) / SR) * u ** 3 * 0.15
    return (x + tone) * g
def wood_bell(m, g=1.0, d=3.2):                          # the brand's "soft organic wooden bell": modal partials
    t = tt(d); f = midi(m); x = np.zeros_like(t)
    for r, a, dc in ((1.0, 1.0, 1.4), (2.76, 0.42, 3.2), (5.40, 0.22, 6.0), (8.93, 0.10, 9.0), (0.5, 0.18, 1.0)):
        x += a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * dc)
    x += filt(noise(len(t)), 'bandpass', [1500, 5000]) * np.exp(-t * 400) * 0.08
    return x * env(t, 0.001) * g * 0.5
def tick(g=1.0):
    t = tt(0.03); return np.sin(2 * np.pi * 4200 * t) * np.exp(-t * 300) * g
def reverse_swell(ms, d=1.6, g=1.0):
    x = room1(stab(ms, 0.3, 1.0, 5000), 2.4)[: int(d * SR)]
    x = x[::-1] * np.linspace(0, 1, len(x)) ** 1.5
    return x * g / (np.abs(x).max() + 1e-9)

def ir(secs, seed):
    t = tt(secs); r = np.random.default_rng(seed)
    return filt(r.standard_normal(len(t)) * np.exp(-t * 6.5 / secs), 'lowpass', 7000)
def room1(x, secs=1.6): h = ir(secs, 3); return signal.fftconvolve(x, h / np.sqrt((h ** 2).sum()))
def room(x, secs=2.2, mix=0.3):
    out = [signal.fftconvolve(x[:, c], (h := ir(secs, 11 + c)) / np.sqrt((h ** 2).sum()))[:N] for c in range(2)]
    return np.stack(out, 1) * mix
def delay(x, secs, fb=0.35, mix=0.35):
    d = int(secs * SR); y = x.copy()
    for k in range(1, 6):
        if d * k < N:
            sh = x[:-d * k] * (fb ** k) * mix
            y[d * k:] += sh[:, ::-1] if k % 2 else sh          # ping-pong
    return y

# ---------------------------------------------------------------- harmony
CH = {'Bm': [59, 62, 66, 71], 'G': [55, 59, 62, 67], 'D': [57, 62, 66, 69], 'A': [57, 61, 64, 69]}
ROOT = {'Bm': 47, 'G': 43, 'D': 50, 'A': 45}
PROG = ['Bm', 'G', 'D', 'A']
MOTIF = [(0, 78), (0.5, 76), (1, 74), (2, 73), (2.5, 74), (3, 69)]     # beat-in-bar, note: F#5 E D | C# D A
def chord_at(bar):
    if bar >= 23: return 'D' if bar == 23 else 'Bm'
    return PROG[(bar - 1) % 4]
def kind(bar):
    return {1: 'intro', 2: 'intro', 3: 'intro', 4: 'intro', 5: 'pulse', 6: 'pulse', 7: 'build', 8: 'build',
            17: 'night', 18: 'night', 19: 'morning', 20: 'morning', 21: 'climax', 22: 'climax', 23: 'end', 24: 'end'}.get(bar, 'full')
kk, dr, bs, mu, fx, at = buf(), buf(), buf(), buf(), buf(), buf()
GAP = (M['gap'], M['hero'])                                  # one beat of silence before the hero shot
kicks = []
for b in range(NB):
    bar, pos = bar_of(b), b % 4; k = kind(bar); ch = chord_at(bar); root = ROOT[ch]; tones = CH[ch]
    if GAP[0] <= b < GAP[1]: continue
    # piano motif: every bar except the full groove's second halves; softer in the night
    if pos == 0 and k in ('intro', 'pulse', 'build', 'night', 'morning') or (k == 'full' and bar % 2 == 1 and pos == 0):
        vel = {'intro': 0.6, 'night': 0.5}.get(k, 0.7)
        for s, m in MOTIF: add(mu, piano(m - (0 if ch in ('Bm', 'D') else 2) - 12 * (k == 'night'), 2.6, 0.42, vel), T(b + s), pan=-0.12)
    if pos == 0 and k in ('intro', 'night', 'end'):
        for j, m in enumerate(tones[:3]): add(mu, piano(m - 12, 3.8, 0.32, 0.55), T(b) + j * 0.02, pan=0.15)
    if pos == 0 and k in ('intro', 'pulse', 'build', 'night', 'morning'):
        add(at, pad(tones, 4 * BEAT + 0.4, 0.22 if k != 'build' else 0.3), T(b))
    if pos == 0 and k != 'end': add(bs, sub(root - 12, 4 * BEAT, 0.35 if k in ('intro', 'night') else 0.25, 0.3), T(b))
    # pulse: muted 8ths from bar 5, opening filter through the build
    if k in ('pulse', 'build', 'morning'):
        open_ = (b - 16) / 16 if k != 'morning' else (b - 72) / 8
        for s in (0, 0.5): add(mu, arp(tones[int(2 * (pos + s)) % 4], 0.12, 0.35 + 0.25 * open_, 900 + 3200 * open_ ** 2), T(b + s), pan=0.5 if s else -0.5)
        for s in (0, 0.5): add(at, tick(0.15), T(b + s + 0.25), pan=0.3)
    if k == 'build' and bar == 8:                            # toms into the drop
        for s in (0, 0.5, 1, 1.5, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75):
            if b - 28 + 0 == int(b - 28) and T(b) >= T(28): pass
        if pos >= 2: 
            for s in (0, 0.25, 0.5, 0.75): add(dr, snare(0.12 + 0.3 * ((b + s - 30) / 2)), T(b + s))
    # full groove / morning drums / climax
    if k in ('full', 'climax') or (k == 'morning' and bar == 20):
        add(kk, kick(0.95), T(b)); kicks.append(T(b))
        if pos in (1, 3): add(dr, clap(0.45), T(b), pan=0.05)
        for s in (0.25, 0.5, 0.75): add(dr, hat(0.5 if s == 0.5 else 0.26), T(b + s), pan=0.3 if s == 0.5 else -0.3)
        for s in (0, 0.25, 0.5, 0.75): add(dr, shaker(0.12), T(b + s + 0.01), pan=0.55)
        for s in (0, 0.5): add(bs, pluck_bass(root - 12 + (12 if (pos % 2 and s) else 0), 0.22, 0.6, 1.1), T(b + s))
        for i, s in enumerate((0, 0.25, 0.5, 0.75)):
            add(mu, arp(tones[(pos * 4 + i) % 4] + 12 * (bar >= 13), 0.1, 0.42, 4200), T(b + s), pan=0.7 if i % 2 else -0.7)
        if pos == 0: add(mu, stab_st([m for m in tones[:3]], 0.6, 0.4), T(b)); add(at, pad(tones, 4 * BEAT + 0.3, 0.2), T(b))
        if 13 <= bar <= 16 and pos in (0, 2):
            add(mu, lead(tones[(bar + pos) % 4] + 12, 0.3, 0.32), T(b + 0.5), pan=0.2)
    if k == 'morning' and bar == 19:
        if pos in (0, 2): add(kk, kick(0.6), T(b)); kicks.append(T(b))
    if k == 'end' and pos == 0:
        for j, m in enumerate(CH['D'] + [74, 78] if bar == 23 else CH['Bm'] + [74]):
            add(mu, piano(m, 5.0, 0.42, 0.9), T(b) + j * 0.025, pan=(j - 2.5) * 0.16)
        add(at, pad((CH['D'] if bar == 23 else CH['Bm']) + [78], 4 * BEAT + (1.5 if bar == 24 else 0.3), 0.32), T(b))
        add(bs, sub(ROOT[ch] - 12, 4 * BEAT + 0.5, 0.45, 0.1), T(b))

# ---------------------------------------------------------------- set pieces on marks
add(fx, riser(T(M['drop']) - T(24), 0.45), T(24))                             # string swell + riser into the drop
add(fx, reverse_swell(CH['Bm'], 1.6, 0.5), T(M['drop']) - 1.6)
add(fx, boom(0.95), T(M['drop'])); add(fx, crash(0.35), T(M['drop'])); add(kk, kick(1.2, big=True), T(M['drop'])); kicks.append(T(M['drop']))
add(fx, boom(0.45), T(M['wake']))
add(fx, wood_bell(78, 0.4), T(M['bloom']), pan=0.15)
for m_, g in ((M['reach'], 0.5), (M['work'], 0.45), (M['morning'], 0.5)): add(fx, crash(0.22 * g / 0.5), T(m_))
add(fx, boom(0.6), T(M['night']))
add(fx, wood_bell(74, 0.35), T(M['compiled']), pan=-0.2)
add(fx, riser(T(M['no1']) - T(76), 0.4), T(76))
for i, m_ in enumerate(('no1', 'no2', 'no3', 'no4')):
    add(fx, boom(0.55 + 0.12 * i), T(M[m_])); add(kk, kick(1.1, big=True), T(M[m_])); kicks.append(T(M[m_]))
add(fx, reverse_swell(CH['D'], 1.0, 0.45), T(M['hero']) - 1.0)
add(fx, braam(38, 3.8, 0.55), T(M['hero'])); add(fx, boom(1.0), T(M['hero'])); add(fx, crash(0.4, 3.6), T(M['hero']))
add(kk, kick(1.3, big=True), T(M['hero'])); kicks.append(T(M['hero']))
for k_, m in enumerate((74, 78, 83)): add(fx, wood_bell(m, 0.5 - 0.1 * k_), T(M['lockup']) + k_ * 0.12, pan=(k_ - 1) * 0.3)

# ---------------------------------------------------------------- mix
duck = np.ones(N); L = int(0.45 * SR)
for k0 in kicks:
    i = int(k0 * SR); e = 1 - 0.5 * np.exp(-np.arange(L) / (0.08 * SR)); seg = duck[i:i + L]; seg[:] = np.minimum(seg, e[:len(seg)])
bs *= duck[:, None]; mu *= (0.6 + 0.4 * duck)[:, None]
bs = filt(bs, 'highpass', 40)
def widen(x, w):
    m_, s_ = (x[:, 0] + x[:, 1]) / 2, (x[:, 0] - x[:, 1]) / 2 * w
    return np.stack([m_ + s_, m_ - s_], 1)
mu = delay(mu, BEAT * 0.75, 0.33, 0.28)
wet = room(mu + dr * 0.4 + fx * 0.6 + at * 0.8, 2.8, 0.38)
mu = widen(mu * 1.2 + filt(mu, 'bandpass', [1800, 5000]) * 0.5, 1.7); wet = widen(wet, 1.6); dr = widen(dr, 1.35); at = widen(at, 1.6)
mix = kk * 0.8 + dr * 0.95 + bs * 0.75 + mu * 1.0 + fx * 0.8 + at * 0.7 + wet
mix = filt(mix, 'highpass', 25)
g0, g1 = int(T(GAP[0]) * SR), int(T(GAP[1]) * SR)
mix[g0:g1] *= np.linspace(1, 0.12, g1 - g0)[:, None] ** 2
fade = int(1.2 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 1.5
mix /= np.abs(mix).max() / 10 ** (-1 / 20)
stem = kk + dr * 0.6; stem /= np.abs(stem).max() / 10 ** (-1 / 20)
os.makedirs('audio', exist_ok=True)
json.dump({'bpm': BPM, 'beat': BEAT, 'offset': 0.0, 'beats': [round(T(b), 5) for b in range(NB + 1)],
           'downbeats': [round(T(b), 5) for b in range(0, NB + 1, 4)],
           'hits': [{'t': round(k0, 5), 's': 1.0} for k0 in sorted(set(round(k, 5) for k in kicks))],
           'source': 'scripts/score.py (exact grid, not measured)'}, open('beats.json', 'w'))
sf.write('audio/music.wav', mix.astype(np.float32), SR, subtype='FLOAT')
sf.write('audio/drums.wav', stem.astype(np.float32), SR, subtype='FLOAT')
print(f'audio/music.wav  {DUR}s  {BPM:g} BPM  {NB} beats  drop {T(M["drop"]):.2f}s  hero {T(M["hero"]):.2f}s')
