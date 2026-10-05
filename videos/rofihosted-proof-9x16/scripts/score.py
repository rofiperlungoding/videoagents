# Custom score for "The Proof" → audio/music.wav + audio/drums.wav (stem for beats.py). Seeded, offline.
#   python3 scripts/score.py
# Direction (user, round 2): like Numtera / NeuraFlow: epic, cinematic, punchy. Built from Numtera's measured groove
# (docs/reference_notes.md): syncopated kick with an 808 locked to it, rolling 16th hats, a big backbeat, a dark pedal
# harmony with one moving voice, heavy glue compression (crest ≈ 3.5). Epic layer: trailer hits + toms on every phrase,
# reverse cymbals into phrases, a wide supersaw swell, braams on the drop and on "Host it.", a halftime section.
# 112 BPM, A minor, 28 bars = 60 s. Marks (beats) from timeline.json.
import json, os
import numpy as np, soundfile as sf
from scipy import signal

TL = json.load(open('timeline.json')); M = TL['marks']
SR, BPM, DUR = 48000, float(TL['bpm']), float(TL['duration'])
BEAT = 60 / BPM; S16 = BEAT / 4; N = int(SR * DUR); NB = int(round(DUR / BEAT))
T = lambda b: b * BEAT
bar_of = lambda b: int(b // 4) + 1
rng = np.random.default_rng(int(TL['music'].get('seed', 808)))

# ---------------------------------------------------------------- dsp helpers
def tt(d): return np.arange(int(d * SR)) / SR
def midi(m): return 440 * 2 ** ((m - 69) / 12)
def noise(n): return rng.standard_normal(n)
def filt(x, kind, f, order=2): return signal.sosfilt(signal.butter(order, f, kind, fs=SR, output='sos'), x, axis=0)
def env(t, a=0.005, d=None, r=0.05, dur=None):
    e = np.minimum(t / max(a, 1e-4), 1)
    if d is not None: e = e * np.exp(-t / d)
    if dur is not None: e = e * np.clip((dur - t) / r, 0, 1)
    return e
def saw(f, t, phase=0.0):
    p = (f * t + phase) % 1.0; dt = np.broadcast_to(f / SR, p.shape); y = 2 * p - 1
    m = p < dt; x = p[m] / dt[m]; y[m] -= x + x - x * x - 1
    m = p > 1 - dt; x = (p[m] - 1) / dt[m]; y[m] -= x * x + x + x + 1
    return y
def sweep_lp(x, f0, f1, curve=2.0, block=256, q=0.707):
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
    if x.ndim == 1: x = np.stack([x * np.sqrt(1 - pan), x * np.sqrt(1 + pan)], 1)
    if i < 0: x, i = x[-i:], 0
    j = min(N, i + len(x))
    if j > i: dst[i:j] += x[: j - i] * gain
def ir(secs, seed, bright=7000):
    t = tt(secs); r = np.random.default_rng(seed)
    return filt(r.standard_normal(len(t)) * np.exp(-t * 6.5 / secs), 'lowpass', bright)
def verb(x, secs=2.4, mix=0.3, bright=7000):
    out = [signal.fftconvolve(x[:, c], (h := ir(secs, 21 + c, bright)) / np.sqrt((h ** 2).sum()))[:len(x)] for c in range(2)]
    return np.stack(out, 1) * mix
def mono_verb(x, secs=1.8): h = ir(secs, 5); return signal.fftconvolve(x, h / np.sqrt((h ** 2).sum()))
def widen(x, w):
    m_, s_ = (x[:, 0] + x[:, 1]) / 2, (x[:, 0] - x[:, 1]) / 2 * w
    return np.stack([m_ + s_, m_ - s_], 1)
def glue(x, thr_db=-18, ratio=4.0, att=0.004, rel=0.12, makeup_db=6):   # bus compressor (feed-forward, peak-ish)
    lvl = np.abs(x).max(1); a_a, a_r = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    e = signal.lfilter([1 - a_r], [1, -a_r], lvl)                         # release-smoothed envelope
    e = np.maximum(e, signal.lfilter([1 - a_a], [1, -a_a], lvl))
    db = 20 * np.log10(e + 1e-9); over = np.maximum(0, db - thr_db)
    g = 10 ** ((-over * (1 - 1 / ratio) + makeup_db) / 20)
    return x * g[:, None]

# ---------------------------------------------------------------- instruments
def kick(g=1.0, big=False):                    # punchy: pitch sweep body + mid knock + click, driven
    t = tt(0.55 if big else 0.32)
    f = 50 + (150 if big else 120) * np.exp(-t * 32)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (5 if big else 11))
    knock = np.sin(2 * np.pi * 180 * t) * np.exp(-t * 60) * 0.35
    click = filt(noise(len(t)), 'bandpass', [2500, 7000]) * np.exp(-t * 700) * 0.35
    return np.tanh((body + knock + click) * 1.3) * g
def bass808(m, d, g=1.0):
    t = tt(d); f = midi(m) * (1 + 0.25 * np.exp(-t * 45))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR)
    x = np.tanh(x * 1.4) * 0.85 + 0.25 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return x * env(t, 0.002, None, 0.04, d) * g
def clap(g=1.0):
    t = tt(0.35); n = filt(noise(len(t)), 'bandpass', [900, 5000])
    e = sum(np.where(t >= o, np.exp(-(t - o) * 280), 0) for o in (0, 0.008, 0.017, 0.026)) + np.where(t >= 0.028, np.exp(-(t - 0.028) * 14) * 0.6, 0)
    return n * e * g
def snare(g=1.0, d=0.3):
    t = tt(d); tone = np.sin(2 * np.pi * np.cumsum(190 + 70 * np.exp(-t * 35)) / SR) * np.exp(-t * 22)
    return np.tanh((tone * 0.8 + filt(noise(len(t)), 'highpass', 1500) * np.exp(-t * 16) * 0.9) * 1.6) * g
def hat(g=1.0, open_=False):
    t = tt(0.3 if open_ else 0.05)
    x = sum(signal.square(2 * np.pi * f * t) for f in (205.3, 304.4, 369.6, 522.7, 540.0, 800.0))
    return filt(filt(x, 'bandpass', [6500, 12000]), 'highpass', 6000) * np.exp(-t * (11 if open_ else 95)) * g * 0.24
def tom(m, g=1.0):
    t = tt(0.7); f = midi(m) * (1 + 0.6 * np.exp(-t * 18))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5.5) + filt(noise(len(t)), 'lowpass', 1500) * np.exp(-t * 25) * 0.4
    return np.tanh(x * 1.8) * g
def crash(g=1.0, d=2.8):
    t = tt(d); x = filt(noise(len(t)), 'highpass', 3500) + 0.35 * filt(noise(len(t)), 'bandpass', [5000, 10000])
    return x * np.exp(-t * 1.6) * env(t, 0.002) * g
def rev_cymbal(d, g=1.0):
    x = crash(1.0, d + 0.3)[::-1][-int(d * SR):]; return x * np.linspace(0.2, 1, len(x)) ** 2 * g
def boom(g=1.0, d=3.2):
    t = tt(d); f = 30 + 75 * np.exp(-t * 8)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.3)
    body = filt(noise(len(t)), 'lowpass', 700) * np.exp(-t * 6) * 0.7
    return np.tanh((s * 1.4 + body) * 1.5) * g
def trailer_hit(g=1.0):                         # boom + low toms + noise burst, verb added on the fx bus
    x = boom(1.0, 3.0); y = np.zeros_like(x)
    for m, o in ((38, 0), (33, 0.01)): z = tom(m, 0.6); y[int(o * SR):int(o * SR) + len(z)] += z[: len(y) - int(o * SR)]
    t = tt(3.0); y += filt(noise(len(t)), 'bandpass', [800, 5000]) * np.exp(-t * 18) * 0.5
    return (x + y) * g
def braam(m=33, d=3.6, g=1.0):
    t = tt(d)
    x = sum(saw(midi(mm) * (1 + dt), t, ph) for mm in (m, m + 7, m + 12, m + 19) for dt, ph in ((-0.012, 0.0), (0.0, 0.33), (0.012, 0.66)))
    x = sweep_lp(x / 12, 160, 3200, curve=0.45)
    return np.tanh(x * 3.2) * np.minimum(t / 0.05, 1) * np.exp(-t * 0.6) * np.clip((d - t) / 0.7, 0, 1) * g
def supersaw(ms, d, g=1.0, cut=2600, attack=0.6):               # wide stereo swell
    t = tt(d); out = []
    for side in (0, 1):
        x = sum(saw(midi(m) * (1 + dt * (1 if side else -1)), t, (ph + side * 0.37) % 1) for m in ms
                for dt, ph in ((0.003, 0.1), (0.009, 0.45), (0.016, 0.8), (0.022, 0.3)))
        out.append(filt(x / (4 * len(ms)), 'lowpass', cut))
    e = np.minimum(t / attack, 1) * np.clip((d - t) / 0.5, 0, 1)
    return np.stack(out, 1) * e[:, None] * g
def arp(m, d=0.12, g=1.0, cut=3800):
    t = tt(d + 0.08); f = midi(m)
    x = saw(f * 1.003, t) + saw(f * 0.997, t, 0.37)
    return sweep_lp(x, cut, cut * 0.3, curve=0.5) * env(t, 0.002, 0.08) * g * 0.35
def stab_st(ms, d=0.5, g=1.0, cut=3800):
    t = tt(d); out = []
    for side, sh in ((0, -1), (1, 1)):
        x = sum(saw(midi(m) * (1 + sh * dt), t, ph + side * 0.31) for m in ms for dt, ph in ((0.004, 0.1), (0.011, 0.5)))
        out.append(sweep_lp(x / (2 * len(ms)), cut, 500, curve=0.6) * env(t, 0.003, 0.22, 0.05, d))
    return np.stack(out, 1) * g
def lead(m, d=0.3, g=1.0):
    t = tt(d + 0.2); f = midi(m) * (1 + 0.003 * np.sin(2 * np.pi * 5.5 * t) * np.minimum(t / 0.2, 1))
    x = 0.55 * saw(f, t) + 0.45 * saw(f * 1.005, t, 0.4)
    return sweep_lp(x, 6000, 1400, curve=0.4) * env(t, 0.003, 0.25, 0.08, d + 0.2) * g * 0.4
def piano(m, d=2.5, g=1.0, vel=1.0):
    t = tt(d); f = midi(m); B = 0.0004; x = np.zeros_like(t)
    for k in range(1, 12):
        fk = k * f * np.sqrt(1 + B * k * k)
        if fk > SR / 2.2: break
        x += (1 / k ** 1.15) * (0.6 + 0.4 * vel) ** (k / 3) * np.sin(2 * np.pi * fk * t + k) * np.exp(-t * (0.9 + 0.55 * k))
    ham = filt(noise(len(t)), 'bandpass', [800, 4000]) * np.exp(-t * 180) * 0.05
    return (x * 0.42 + ham) * env(t, 0.002, None, 0.3, d) * g * vel
def drone(m, d, g=1.0):
    t = tt(d); f = midi(m)
    x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.12 * saw(f * 2.002, t)
    x = filt(x, 'lowpass', 600)
    return x * np.minimum(t / (d * 0.7), 1) ** 1.5 * np.clip((d - t) / 0.2, 0, 1) * g
def riser(d, g=1.0):
    t = tt(d); u = t / d
    x = sweep_lp(filt(noise(len(t)), 'highpass', 300), 400, 10000, curve=2.0) * u ** 2.2
    tone = np.sin(2 * np.pi * np.cumsum(160 * 2 ** (3.2 * u)) / SR) * u ** 3 * 0.18
    return (x + tone) * g
def wood_bell(m, g=1.0, d=3.2):
    t = tt(d); f = midi(m); x = np.zeros_like(t)
    for r, a, dc in ((1.0, 1.0, 1.4), (2.76, 0.42, 3.2), (5.40, 0.22, 6.0), (8.93, 0.10, 9.0), (0.5, 0.18, 1.0)):
        x += a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * dc)
    return (x + filt(noise(len(t)), 'bandpass', [1500, 5000]) * np.exp(-t * 400) * 0.08) * env(t, 0.001) * g * 0.5
def tick(g=1.0):
    t = tt(0.03); return np.sin(2 * np.pi * 4200 * t) * np.exp(-t * 300) * g
def heartbeat(g=1.0):
    t = tt(0.5); return np.sin(2 * np.pi * np.cumsum(55 + 30 * np.exp(-t * 20)) / SR) * np.exp(-t * 9) * g

# ---------------------------------------------------------------- harmony: A pedal, one moving voice (Numtera's trick)
# voicings over the A pedal: A-E always, the third voice walks C -> F -> E -> D (Am, F/A, Asus-ish, Dm/A)
VOICE = [[57, 64, 72], [57, 64, 65 + 12], [57, 64, 76], [57, 64, 74]]
BASSROOT = [45, 41, 43, 45]                      # A2, F2, G2, A2: the 808 lives in 60-250 Hz like Numtera's
def harm(bar): return VOICE[(bar - 1) % 4], BASSROOT[(bar - 1) % 4]
KICK = [0, 3, 6, 10, 13]                         # 16th slots (Numtera's dotted drive)
GHOST = [7, 15]

def kind(bar):
    if bar <= 4: return 'intro'
    if bar <= 19: return 'proof'
    if bar <= 21: return 'half'
    if bar <= 23: return 'breakdown'
    if bar <= 25: return 'build'
    if bar == 26: return 'climax'
    if bar == 27: return 'host'
    return 'end'
GAP = (M['future'], M['host'])

kk, dr, bs, mu, pd, fx, at = buf(), buf(), buf(), buf(), buf(), buf(), buf()
kicks = []
def k_at(t0, g=1.0, big=False): add(kk, kick(g, big), t0); kicks.append(t0)

for bar in range(1, 29):
    b0 = (bar - 1) * 4; k = kind(bar); voice, root = harm(bar)
    if GAP[0] <= b0 < GAP[1]: continue
    phrase_end = bar % 4 == 0
    if k == 'intro':                                  # ticking clock, heartbeat sub, rising arp, piano
        for s in range(8): add(at, tick(0.16 + 0.04 * bar), T(b0 + s * 0.5), pan=0.4 if s % 2 else -0.4)
        for s in (0, 2): add(at, heartbeat(0.35 + 0.12 * bar), T(b0 + s))
        add(mu, piano(69 if bar % 2 else 72, 3.6, 0.5, 0.75), T(b0), pan=-0.2)
        if bar >= 2:
            for s16 in range(16):
                add(mu, arp(voice[s16 % 3] + 12, 0.1, 0.1 + 0.33 * ((b0 - 4) / 12), 500 + 3500 * ((b0 + s16 / 4 - 4) / 12) ** 2), T(b0) + s16 * S16, pan=0.7 if s16 % 2 else -0.7)
    if k in ('proof', 'climax', 'build', 'half'):
        half = k == 'half'
        # kick + 808 locked together
        kslots = [0, 10] if half else KICK
        if k == 'build': kslots = [0, 4, 8, 12] if bar == 24 else [0, 2, 4, 6, 8, 10, 12, 14]
        for i, sl in enumerate(kslots):
            k_at(T(b0) + sl * S16, 1.0)
            nxt = (kslots[i + 1] if i + 1 < len(kslots) else 16) - sl
            if k != 'build': add(bs, bass808(root + (12 if (sl == 13 and not half) else 0), nxt * S16 * 0.95, 0.85), T(b0) + sl * S16)
        # backbeat: clap + snare layered (halftime: on 3)
        for sl in ([8] if half else [4, 12]):
            if k != 'build': add(dr, clap(0.6), T(b0) + sl * S16, pan=0.05); add(dr, snare(0.55), T(b0) + sl * S16, pan=-0.05)
        if not half and k != 'build':
            for sl in GHOST: add(dr, snare(0.12, 0.12), T(b0) + sl * S16, pan=0.2)
        # rolling 16th hats, accents on 8ths, open hat at 14
        for sl in range(16):
            if half and sl % 2: continue
            add(dr, hat(0.55 if sl % 4 == 2 else 0.4 if sl % 2 == 0 else 0.24), T(b0) + sl * S16, pan=0.3 if sl % 2 else -0.25)
        if not half: add(dr, hat(0.3, True), T(b0) + 14 * S16, pan=0.35)
        # harmony: wide supersaw bed (side-chained), stabs on 1, pulse arp, lead
        add(pd, supersaw(voice, 4 * BEAT + 0.3, 0.42 if k != 'half' else 0.5, 2400 if k != 'climax' else 3600, 0.08), T(b0))
        add(mu, stab_st([m + 12 for m in voice], 0.5, 0.5), T(b0))
        for s16 in range(16):
            if half and s16 % 2: continue
            add(mu, arp(voice[(s16 + bar) % 3] + 12 + (12 if bar >= 13 else 0), 0.09, 0.38, 4200), T(b0) + s16 * S16, pan=0.75 if s16 % 2 else -0.75)
        if (bar >= 9 and not half) or k in ('build', 'climax'):
            motif = [(0, 0), (3, 2), (6, 1), (10, 2), (12, 1)]          # lead follows the kick's dotted rhythm
            for sl, vi in motif: add(mu, lead(voice[vi] + 12 + (12 if k == 'climax' else 0), 0.2, 0.5), T(b0) + sl * S16, pan=-0.15 if sl % 2 else 0.15)
        if bar % 2 == 1: add(mu, piano(voice[2] + 12, 2.4, 0.4, 0.85), T(b0), pan=-0.25)
        # epic: trailer hit + crash on every phrase start, reverse cymbal into it, tom fill at the phrase end
        if (bar - 5) % 4 == 0 and k in ('proof', 'half'):
            add(fx, trailer_hit(0.55), T(b0)); add(fx, crash(0.3), T(b0))
        if phrase_end and k in ('proof', 'half') and bar not in (19, 21):
            add(fx, rev_cymbal(BEAT * 2, 0.4), T(b0 + 4) - BEAT * 2)
            for j, (sl, m) in enumerate(((12, 45), (13, 43), (14, 40), (15, 36))): add(dr, tom(m, 0.55), T(b0) + sl * S16, pan=0.4 - 0.27 * j)
        if k == 'build':                                           # snare roll accelerating, supersaw rising
            step = 2 if bar == 24 else 1
            for sl in range(0, 16, step):
                pos = (b0 + sl / 4 - M['they']) / 8
                add(dr, snare(0.18 + 0.55 * pos ** 1.4, 0.18), T(b0) + sl * S16, pan=-0.05)
        if k == 'climax':
            for s in (0, 1, 2): add(fx, crash(0.28, 1.5), T(b0 + s)); add(fx, trailer_hit(0.4), T(b0 + s))
    if k == 'breakdown':                                           # drums out: piano chords, supersaw, sub swell
        for j, m in enumerate([57, 60, 64, 69] if bar == 22 else [55, 59, 62, 67]):
            add(mu, piano(m, 4.2, 0.5, 0.8), T(b0) + j * 0.02, pan=(j - 1.5) * 0.18)
        add(pd, supersaw([57, 64, 69] if bar == 22 else [55, 62, 67], 4 * BEAT + 0.4, 0.38, 1600, 0.6), T(b0))
        add(bs, drone(33 if bar == 22 else 31, 4 * BEAT, 0.6), T(b0))
        for s in (0, 2): add(at, heartbeat(0.5), T(b0 + s))
    if k == 'end':
        for j, m in enumerate([57, 60, 64, 69, 76]): add(mu, piano(m, 4.5, 0.55, 0.9), T(b0) + j * 0.03, pan=(j - 2) * 0.2)
        add(pd, supersaw([45, 57, 64, 69], DUR - T(b0), 0.4, 1800, 0.3), T(b0))

# ---------------------------------------------------------------- set pieces on marks
add(at, drone(33, T(16) + 0.1, 0.55), 0)
add(fx, riser(T(M['meet']) - T(8), 0.5), T(8))
add(fx, rev_cymbal(1.6, 0.55), T(M['meet']) - 1.6)
add(fx, braam(33, 3.8, 0.8), T(M['meet'])); add(fx, trailer_hit(0.9), T(M['meet'])); add(fx, crash(0.45, 3.5), T(M['meet']))
k_at(T(M['meet']), 1.25, big=True)
for b_, g_ in ((M['tablet'], 0.7), (M['phone'], 0.6), (M['flood'], 0.75), (M['and'], 0.85)):
    add(fx, trailer_hit(g_), T(b_)); add(fx, crash(0.3 * g_ / 0.7), T(b_))
add(fx, wood_bell(76, 0.55), T(M['notif']), pan=0.2); add(fx, wood_bell(81, 0.3), T(M['notif']) + 0.09, pan=0.25)
add(fx, wood_bell(76, 0.35), T(M['v3']), pan=-0.2)
add(fx, riser(T(M['no1']) - T(M['they']), 0.6), T(M['they']))
add(fx, rev_cymbal(1.2, 0.55), T(M['host']) - 1.2)
add(fx, braam(33, 4.0, 1.0), T(M['host'])); add(fx, trailer_hit(1.0), T(M['host'])); add(fx, crash(0.5, 3.8), T(M['host']))
k_at(T(M['host']), 1.35, big=True)
for j, m in enumerate((69, 76, 81)): add(fx, wood_bell(m, 0.5 - 0.1 * j), T(M['logo_mark']) + j * 0.12, pan=(j - 1) * 0.3)
add(fx, wood_bell(69, 0.45, 4.0), T(M['url']))

# ---------------------------------------------------------------- mix + master
duck = np.ones(N); L = int(0.42 * SR)
for k0 in kicks:
    i = int(k0 * SR); e = 1 - 0.6 * np.exp(-np.arange(L) / (0.07 * SR)); seg = duck[i:i + L]; seg[:] = np.minimum(seg, e[:len(seg)])
bs = filt(bs, 'highpass', 30) * (0.35 + 0.65 * duck)[:, None]
pd *= (0.25 + 0.75 * duck)[:, None]; mu *= (0.5 + 0.5 * duck)[:, None]
mu = widen(mu * 1.2 + filt(mu, 'bandpass', [1800, 5000]) * 0.5, 1.7); pd = widen(pd, 1.5); dr = widen(dr, 1.35)
d = int(BEAT * 0.75 * SR); dl = mu.copy()
for j in range(1, 5): dl[d * j:] += (mu[:-d * j] * 0.33 ** j * 0.35)[:, ::-1 if j % 2 else 1]
mu = dl
wet = widen(verb(mu + pd * 0.6 + dr * 0.35 + fx * 0.7 + at * 0.8, 2.8, 0.34), 1.5)
drums = glue(kk * 1.5 + dr * 1.1, -12, 2.0, 0.012, 0.09, 1)                          # punchy drum bus
music = drums + bs * 0.9 + mu * 0.75 + pd * 0.55 + fx * 0.9 + at * 0.7 + wet * 0.75
music = filt(music, 'highpass', 25)
music = glue(music, -8, 1.5, 0.020, 0.25, 0)                                       # glue the whole mix
music = np.tanh(music * 0.6) / np.tanh(0.6)                                       # gentle saturation
g0, g1 = int(T(GAP[0]) * SR), int(T(GAP[1]) * SR)
music[g0:g1] *= np.linspace(1, 0.12, g1 - g0)[:, None] ** 2                          # the silent beat
fade = int(0.35 * SR); music[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 2
music /= np.abs(music).max() / 10 ** (-1 / 20)
stem = kk; stem /= np.abs(stem).max() / 10 ** (-1 / 20)
os.makedirs('audio', exist_ok=True)
# our own score: the grid is exact, so write beats.json from it (a tracker misreads the syncopated kick as 149 BPM)
json.dump({'bpm': BPM, 'beat': BEAT, 'offset': 0.0, 'beats': [round(T(b), 5) for b in range(NB + 1)],
           'downbeats': [round(T(b), 5) for b in range(0, NB + 1, 4)],
           'hits': [{'t': round(k0, 5), 's': 1.0} for k0 in sorted(set(round(k, 5) for k in kicks))],
           'source': 'scripts/score.py (exact grid, not measured)'}, open('beats.json', 'w'))
sf.write('audio/music.wav', music.astype(np.float32), SR, subtype='FLOAT')
sf.write('audio/drums.wav', stem.astype(np.float32), SR, subtype='FLOAT')
print(f'audio/music.wav + audio/drums.wav  {DUR}s  {BPM:g} BPM  {NB} beats  drop {T(M["meet"]):.2f}s  host {T(M["host"]):.2f}s  crest {np.abs(music).max() / np.sqrt(np.mean(music ** 2)):.1f}')
