# Custom cinematic score for "The Proof" → audio/music.wav + audio/drums.wav (stem for beats.py). Seeded, offline.
#   python3 scripts/score.py
# Shape measured from the references (docs/reference_notes.md): quiet rising intro, the drop on the brand name,
# a steady bass-heavy loop under the proof, a breakdown, a build, one beat of silence, a braam, a bell-lit tail.
# 112 BPM, A minor, 28 bars = 60 s. Timeline marks (beats) come from timeline.json.
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
A, F, C, G, E, D = 57, 53, 48, 55, 52, 50                  # roots around A3
CH = {'Am': [57, 60, 64, 69], 'F': [53, 57, 60, 65], 'C': [48, 52, 55, 60, 64], 'G': [55, 59, 62, 67], 'Em': [52, 55, 59, 64], 'Dm': [50, 53, 57, 62]}
ROOT = {'Am': 45, 'F': 41, 'C': 36, 'G': 43, 'Em': 40, 'Dm': 38}
PROG = ['Am', 'F', 'C', 'G']
def chord_at(bar):
    if bar <= 4: return 'Am'
    if 22 <= bar <= 23: return ['F', 'G'][bar - 22]
    if bar >= 27: return 'Am'
    return PROG[(bar - 5) % 4]

kk, dr, bs, mu, fx, at = buf(), buf(), buf(), buf(), buf(), buf()   # kick, drums, bass, music, fx, atmosphere
def kind(bar):
    if bar <= 4: return 'intro'
    if bar <= 21: return 'proof'
    if bar <= 23: return 'breakdown'
    if bar <= 25: return 'build'
    if bar == 26: return 'climax'
    if bar == 27: return 'host'
    return 'end'
GAP = (M['future'], M['host'])                             # one beat of silence before "Host it."

kicks = []
for b in range(NB):
    bar, pos = bar_of(b), b % 4; k = kind(bar); ch = chord_at(bar); root = ROOT[ch]; tones = CH[ch]
    if GAP[0] <= b < GAP[1]: continue
    # ---- intro: ticking pulse, sub, sparse piano, filtered arp rising
    if k == 'intro':
        for s in (0, 0.5): add(at, tick(0.18 + 0.05 * (bar - 1)), T(b + s), pan=0.3 if s else -0.3)
        if pos == 0 and bar in (1, 3): add(mu, piano(69 if bar == 1 else 72, 3.6, 0.5, 0.7), T(b), pan=-0.15)
        if pos == 2 and bar in (2, 4): add(mu, piano(64, 3.0, 0.45, 0.6), T(b), pan=0.15)
        if bar >= 3:
            for s in (0, 0.25, 0.5, 0.75):
                add(mu, arp(tones[int((b * 4 + s * 4)) % 4] + 12, 0.11, 0.12 + 0.3 * (b - 8) / 8, 600 + 2400 * ((b - 8) / 8) ** 2), T(b + s), pan=0.7 if int(s * 4) % 2 else -0.7)
    # ---- proof: the loop
    if k in ('proof', 'build', 'climax'):
        light = bar in (20, 21)                           # "Close the tab / it keeps working": half-time feel
        if not light or pos in (0, 2):
            add(kk, kick(1.0), T(b)); kicks.append(T(b))
        if pos in (1, 3) and not light: add(dr, clap(0.55), T(b), pan=0.06)
        for s in ((0.25, 0.5, 0.75) if not light else (0.5,)):
            add(dr, hat(0.62 if s == 0.5 else 0.34), T(b + s), pan=0.3 if s == 0.5 else -0.3)
        if not light:
            for s in (0, 0.25, 0.5, 0.75): add(dr, shaker(0.16 + 0.08 * (s in (0.25, 0.75))), T(b + s + 0.01), pan=0.55)
        if pos == 3 and not light: add(dr, hat(0.25, True), T(b + 0.5), pan=0.3)
        # bass: 8ths, octave pops on the "and" of 2 and 4
        for s in (0, 0.5):
            add(bs, pluck_bass(root + (12 if (pos in (1, 3) and s == 0.5) else 0), 0.2, 0.62, 1.2 + 0.3 * (k != 'proof')), T(b + s))
        # pulse arp: 16ths of chord tones, up an octave in the second half of the proof
        oct_ = 12 if bar >= 13 or k != 'proof' else 0
        for i, s in enumerate((0, 0.25, 0.5, 0.75)):
            add(mu, arp(tones[(pos * 4 + i) % len(tones)] + oct_, 0.1, 0.5, 4200 if k == 'proof' else 5600), T(b + s), pan=0.75 if i % 2 else -0.75)
        if pos == 0: add(mu, stab_st([m + 12 for m in tones[:3]], 0.5, 0.55), T(b))
        if pos == 0 and bar % 2 == 1: add(mu, piano(tones[-1] + 12, 2.2, 0.45, 0.85), T(b + 0.02), pan=-0.25)
        # lead motif (bars 9-18 and the climax): eighths x . x x . x . x on chord tones, two octaves up
        if (9 <= bar <= 18 or k in ('build', 'climax')) and not light:
            for e8, on in zip(range(2), ((1, 0) if pos % 2 == 0 else (1, 1))):
                if on: add(mu, lead(tones[(bar + pos + e8) % len(tones)] + 24, 0.22, 0.45), T(b + e8 * 0.5), pan=0.2 if e8 else -0.2)
    # ---- breakdown: drums out; piano chords, pad, sub
    if k == 'breakdown':
        if pos == 0:
            for j, m in enumerate(tones): add(mu, piano(m, 4.0, 0.45, 0.75), T(b) + j * 0.018, pan=(j - 1.5) * 0.15)
            add(mu, pad(tones, 4 * BEAT + 0.6, 0.35), T(b))
            add(bs, sub(root - 12 + 12, 4 * BEAT, 0.6, 0.2), T(b))
        if pos in (2,): add(mu, piano(tones[2] + 12, 2.0, 0.3, 0.6), T(b), pan=0.2)
        if bar == 23 and pos == 2: add(kk, kick(0.7), T(b)); kicks.append(T(b))
    # ---- build: snare roll accelerating, riser handled below
    if k == 'build':
        step = 0.5 if bar == 24 else (0.25 if pos < 2 else 0.125)
        s = 0.0
        while s < 1 - 1e-9:
            add(dr, snare(0.18 + 0.4 * ((b - M['they']) / 8) ** 1.5), T(b + s), pan=-0.05); s += step
    # ---- host / end: braam, mark, tail
    if k == 'end' and pos == 0:
        for j, m in enumerate(CH['Am'] + [76]): add(mu, piano(m, 4.5, 0.5, 0.9), T(b) + j * 0.03, pan=(j - 2) * 0.18)
        add(mu, pad(CH['Am'] + [71], DUR - T(b), 0.32), T(b))

# ---------------------------------------------------------------- set pieces on marks
add(at, sub(45, T(16) + 0.2, 0.32, 3.5), 0)                                   # intro drone A1, swelling
add(fx, riser(T(M['meet']) - T(10), 0.42), T(10))                             # riser into the drop
add(fx, reverse_swell(CH['Am'], 1.4, 0.5), T(M['meet']) - 1.4)
for b_, big in ((M['meet'], 1.0), (M['tablet'], 0.7), (M['phone'], 0.6), (M['flood'], 0.65), (M['and'], 0.8)):
    add(fx, boom(0.9 * big), T(b_)); add(fx, crash(0.3 * big), T(b_))
add(kk, kick(1.2, big=True), T(M['meet'])); kicks.append(T(M['meet']))
add(fx, wood_bell(76, 0.55), T(M['notif']), pan=0.2)                           # "report ready" bell (E5)
add(fx, wood_bell(81, 0.3), T(M['notif']) + 0.09, pan=0.25)
add(fx, wood_bell(76, 0.35), T(M['v3']), pan=-0.2)                            # 3/3 verified
add(fx, riser(T(M['no1']) - T(M['they']), 0.5), T(M['they']))                # build riser
add(fx, reverse_swell(CH['Am'], 1.0, 0.45), T(M['host']) - 1.0)
add(fx, braam(33, 3.6, 0.75), T(M['host'])); add(fx, boom(1.0), T(M['host'])); add(fx, crash(0.4, 3.5), T(M['host']))
add(kk, kick(1.3, big=True), T(M['host'])); kicks.append(T(M['host']))
for k_, m in enumerate((69, 76, 81)): add(fx, wood_bell(m, 0.5 - 0.1 * k_), T(M['logo_mark']) + k_ * 0.12, pan=(k_ - 1) * 0.3)
add(fx, wood_bell(69, 0.45, 4.0), T(M['url']), pan=0.0)

# ---------------------------------------------------------------- mix
duck = np.ones(N); L = int(0.45 * SR)
for k0 in kicks:
    i = int(k0 * SR); e = 1 - 0.55 * np.exp(-np.arange(L) / (0.08 * SR)); seg = duck[i:i + L]; seg[:] = np.minimum(seg, e[:len(seg)])
bs *= duck[:, None]; mu *= (0.55 + 0.45 * duck)[:, None]
bs = filt(bs, 'highpass', 48)
def widen(x, w):
    m_, s_ = (x[:, 0] + x[:, 1]) / 2, (x[:, 0] - x[:, 1]) / 2 * w
    return np.stack([m_ + s_, m_ - s_], 1)
mu = delay(mu, BEAT * 0.75, 0.33, 0.3)
wet = room(mu + dr * 0.5 + fx * 0.6 + at * 0.8, 2.6, 0.36)
mu = widen(mu * 1.25 + filt(mu, 'bandpass', [1800, 5000]) * 0.6, 1.8); wet = widen(wet, 1.6); dr = widen(dr, 1.4)
mix = kk * 0.8 + dr * 1.0 + bs * 0.75 + mu * 1.0 + fx * 0.8 + at * 0.6 + wet
mix = filt(mix, 'highpass', 25)
g0, g1 = int(T(GAP[0]) * SR), int(T(GAP[1]) * SR)             # the silent beat: only reverb tails survive, then cut
mix[g0:g1] *= np.linspace(1, 0.15, g1 - g0)[:, None] ** 2
fade = int(0.35 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 2
peak = np.abs(mix).max(); mix /= peak / 10 ** (-1 / 20)
stem = kk + dr * 0.6; stem /= np.abs(stem).max() / 10 ** (-1 / 20)
os.makedirs('audio', exist_ok=True)
sf.write('audio/music.wav', mix.astype(np.float32), SR, subtype='FLOAT')
sf.write('audio/drums.wav', stem.astype(np.float32), SR, subtype='FLOAT')
print(f'audio/music.wav + audio/drums.wav  {DUR}s  {BPM:g} BPM  {NB} beats  drop at {T(M["meet"]):.2f}s  host at {T(M["host"]):.2f}s')
