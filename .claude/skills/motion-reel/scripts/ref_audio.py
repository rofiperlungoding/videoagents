# Listen to a reference's soundtrack so the score can follow it. Run from the project root after ref.py:
#   python3 scripts/ref_audio.py <name>            (reads refs/<name>/source.mp4)
#
# Writes refs/<name>/:
#   audio.png    mel spectrogram + loudness curve, with detected impacts (▼), risers (↗), sections and beats  ← LOOK
#   audio.json   loudness (LUFS, LRA, true peak), tempo + stability, key, spectral balance per band, stereo width,
#                sections (start, level, density, character), impacts, risers, click/tick density, voice likelihood
#   audio.md     the same, readable, plus a "score brief": what our synthesized music and SFX should do to match
import json, os, subprocess, sys
import numpy as np, librosa, soundfile as sf
from scipy.signal import find_peaks
from PIL import Image, ImageDraw, ImageFont

if len(sys.argv) < 2: raise SystemExit('usage: python3 scripts/ref_audio.py <name>   (after scripts/ref.py)')
NAME = sys.argv[1]; D = os.path.join('refs', NAME); SRC = os.path.join(D, 'source.mp4')
if not os.path.exists(SRC): raise SystemExit(f'{SRC} missing: run python3 scripts/ref.py <url|file> --name {NAME} first')
WAV = os.path.join(D, 'audio_st.wav')
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', SRC, '-ac', '2', '-ar', '44100', WAV], check=True)
st, SR = sf.read(WAV, always_2d=True); y = st.mean(1).astype(np.float32); DUR = len(y) / SR
A = {'name': NAME, 'duration': round(DUR, 2)}

# loudness (EBU R128)
e = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', WAV, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
s = e[e.rfind('Summary'):]
grab = lambda k: next((float(l.split()[1]) for l in s.splitlines() if l.strip().startswith(k)), None)
A['loudness'] = {'integrated_lufs': grab('I:'), 'range_lu': grab('LRA:'), 'true_peak_dbtp': grab('Peak:')}

# tempo, beats, stability
oenv = librosa.onset.onset_strength(y=y, sr=SR)
tempo, beats = librosa.beat.beat_track(onset_envelope=oenv, sr=SR, units='time')
tempo = float(np.atleast_1d(tempo)[0]); ibi = np.diff(beats) if len(beats) > 2 else np.array([60 / tempo])
pulse = float(np.mean(oenv[librosa.time_to_frames(beats, sr=SR)]) / (np.mean(oenv) + 1e-9)) if len(beats) else 0
A['tempo'] = {'bpm': round(tempo, 1), 'beats': len(beats), 'stability_ms': round(float(np.std(ibi)) * 1000, 1),
              'pulse_strength': round(pulse, 2), 'note': 'pulse_strength > 1.6 = a clear beat you can cut to; < 1.2 = ambient / rubato'}

# key (Krumhansl)
chroma = librosa.feature.chroma_cqt(y=y, sr=SR).mean(1)
MAJ = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]); MIN = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
best = max(((np.corrcoef(np.roll(p, k), chroma)[0, 1], NOTES[k] + (' major' if p is MAJ else ' minor')) for p in (MAJ, MIN) for k in range(12)))
A['key'] = {'estimate': best[1], 'confidence': round(float(best[0]), 2)}

# spectral balance
S = np.abs(librosa.stft(y, n_fft=4096, hop_length=1024)) ** 2; f = librosa.fft_frequencies(sr=SR, n_fft=4096)
bands = {'sub <60': (0, 60), 'bass 60-250': (60, 250), 'low-mid 250-2k': (250, 2000), 'presence 2k-6k': (2000, 6000), 'air >6k': (6000, SR / 2)}
tot = S.sum() + 1e-12
A['spectral_balance_pct'] = {k: round(float(S[(f >= a) & (f < b)].sum() / tot * 100), 1) for k, (a, b) in bands.items()}
cent = librosa.feature.spectral_centroid(S=np.sqrt(S), sr=SR)[0]
A['brightness_hz'] = round(float(np.median(cent)))
mid, side = (st[:, 0] + st[:, 1]) / 2, (st[:, 0] - st[:, 1]) / 2
A['stereo_width'] = round(float(np.sqrt(np.mean(side ** 2)) / (np.sqrt(np.mean(mid ** 2)) + 1e-9)), 2)

# loudness curve (10 Hz, dB) → sections by novelty
hop = SR // 10
rms = librosa.feature.rms(y=y, frame_length=hop * 2, hop_length=hop)[0]; db = 20 * np.log10(rms + 1e-6)
sm = np.convolve(db, np.ones(15) / 15, 'same')
nov = np.abs(np.diff(np.convolve(sm, np.ones(10) / 10, 'same'), n=1)); nov = np.convolve(nov, np.ones(5) / 5, 'same')
pk, _ = find_peaks(nov, distance=30, prominence=max(0.15, float(np.percentile(nov, 90))))
cuts = [0.0] + [round(p / 10, 1) for p in pk] + [round(DUR, 1)]
ot = librosa.onset.onset_detect(onset_envelope=oenv, sr=SR, units='time')
sections = []
for a, b in zip(cuts[:-1], cuts[1:]):
    seg = db[int(a * 10):max(int(a * 10) + 1, int(b * 10))]
    lvl = float(np.mean(seg)); dens = sum(a <= o < b for o in ot) / max(0.1, b - a)
    trend = float(np.polyfit(np.arange(len(seg)), seg, 1)[0] * 10) if len(seg) > 3 else 0
    sections.append({'start': a, 'end': b, 'level_db': round(lvl, 1), 'onsets_per_s': round(dens, 1), 'trend_db_per_s': round(trend, 1)})
lo, hi = np.percentile([x['level_db'] for x in sections], [33, 66]) if sections else (0, 0)
for x in sections:
    x['character'] = ('build' if x['trend_db_per_s'] > 1.5 else 'decay' if x['trend_db_per_s'] < -1.5 else
                      'quiet' if x['level_db'] < lo else 'full' if x['level_db'] > hi else 'mid') + (' / busy' if x['onsets_per_s'] > 4 else ' / sparse' if x['onsets_per_s'] < 1.5 else '')
A['sections'] = sections

# impacts (broadband + low-end hits), risers (sustained HF rise into a hit), ticks (short HF transients)
low = librosa.feature.rms(S=np.sqrt(S[f < 150]), frame_length=1)[0] if False else np.sqrt(S[f < 150].sum(0))
hf = np.sqrt(S[f > 4000].sum(0)); tt = librosa.frames_to_time(np.arange(S.shape[1]), sr=SR, hop_length=1024)
lowd = np.maximum(0, np.diff(20 * np.log10(low + 1e-6), prepend=0))
ip, _ = find_peaks(lowd, height=9, distance=int(0.4 * SR / 1024))
A['impacts'] = [round(float(tt[i]), 2) for i in ip]
hfd = 20 * np.log10(hf + 1e-6); risers = []
w = int(1.0 * SR / 1024)
for i in range(w, len(hfd) - 2, w // 2):
    seg = hfd[i - w:i]
    if np.polyfit(np.arange(w), seg, 1)[0] * (SR / 1024) > 8 and seg[-1] - seg[0] > 10: risers.append(round(float(tt[i]), 2))
A['risers_end_at'] = sorted({r for r in risers if all(abs(r - q) > 1 for q in risers if q < r)})
hp = librosa.effects.percussive(y, margin=3.0); ho = librosa.onset.onset_detect(y=hp, sr=SR, units='time', backtrack=False)
A['percussive_onsets_per_s'] = round(len(ho) / DUR, 2)
A['harmonic_percussive_ratio'] = round(float(np.sum(librosa.effects.harmonic(y) ** 2) / (np.sum(hp ** 2) + 1e-9)), 2)

# voice likelihood: syllabic (3–7 Hz) modulation of the 300–3400 Hz band
vb = np.sqrt(S[(f > 300) & (f < 3400)].sum(0)); vb = vb - np.convolve(vb, np.ones(43) / 43, 'same')
spec = np.abs(np.fft.rfft(vb)); mf = np.fft.rfftfreq(len(vb), d=1024 / SR)
syl = float(spec[(mf > 3) & (mf < 7)].sum() / (spec[(mf > 0.5) & (mf < 15)].sum() + 1e-9))
A['voice'] = {'syllabic_modulation': round(syl, 2), 'likely': 'yes' if syl > 0.42 else 'maybe' if syl > 0.34 else 'no'}

# picture: mel spectrogram + loudness + markers
M = librosa.power_to_db(librosa.feature.melspectrogram(y=y, sr=SR, n_mels=128, hop_length=512), ref=np.max)
img = ((np.clip(M, -80, 0) + 80) / 80 * 255).astype(np.uint8)[::-1]
Wp = int(min(2400, max(1200, DUR * 40))); spec_im = Image.fromarray(img).resize((Wp, 300))
cm = np.array([[int(255 * min(1, v * 1.6)), int(255 * min(1, max(0, v * 1.6 - 0.4))), int(255 * max(0, v * 2.2 - 1.2))] for v in np.linspace(0, 1, 256)], np.uint8)
spec_rgb = Image.fromarray(cm[np.array(spec_im)])
H = 300 + 140 + 40; P = Image.new('RGB', (Wp, H), (14, 14, 16)); P.paste(spec_rgb, (0, 0)); d = ImageDraw.Draw(P)
try: F = ImageFont.truetype('DejaVuSans.ttf', 13)
except Exception: F = ImageFont.load_default()
X = lambda t: int(t / DUR * (Wp - 1))
curve = np.interp(np.linspace(0, len(db) - 1, Wp), np.arange(len(db)), sm); cmin, cmax = np.percentile(curve, 2), curve.max()
pts = [(x, 300 + 130 - int((c - cmin) / (cmax - cmin + 1e-9) * 120)) for x, c in enumerate(curve)]
d.line(pts, fill=(163, 230, 53), width=2)
for b in beats: d.line([(X(b), 300), (X(b), 306)], fill=(90, 90, 100))
for sct in sections: d.line([(X(sct['start']), 0), (X(sct['start']), H - 40)], fill=(255, 255, 255), width=1); d.text((X(sct['start']) + 3, 302 + 8), sct['character'], fill=(230, 230, 230), font=F)
for t in A['impacts']: d.polygon([(X(t) - 6, 0), (X(t) + 6, 0), (X(t), 10)], fill=(251, 113, 133))
for t in A['risers_end_at']: d.text((X(t) - 8, 14), '↗', fill=(251, 191, 36), font=F)
for k in range(int(DUR) + 1):
    if k % (5 if DUR > 30 else 2) == 0: d.text((X(k) + 2, H - 30), f'{k}s', fill=(180, 180, 180), font=F)
d.text((6, H - 16), f'{NAME}: {A["tempo"]["bpm"]} BPM · {A["key"]["estimate"]} · {A["loudness"]["integrated_lufs"]} LUFS · ▼ impacts  ↗ risers  — lime = loudness', fill=(200, 200, 200), font=F)
P.save(os.path.join(D, 'audio.png'))
json.dump(A, open(os.path.join(D, 'audio.json'), 'w'), indent=1)

sb = A['spectral_balance_pct']
lines = [f'# Audio: {NAME}', '', f'{DUR:.1f}s · {A["tempo"]["bpm"]} BPM (pulse strength {A["tempo"]["pulse_strength"]}, jitter {A["tempo"]["stability_ms"]} ms) · key ~{A["key"]["estimate"]} ({A["key"]["confidence"]})',
         f'Loudness {A["loudness"]["integrated_lufs"]} LUFS, range {A["loudness"]["range_lu"]} LU, peak {A["loudness"]["true_peak_dbtp"]} dBTP · stereo width {A["stereo_width"]} · brightness {A["brightness_hz"]} Hz',
         'Balance: ' + ' · '.join(f'{k} {v}%' for k, v in sb.items()),
         f'Percussive onsets {A["percussive_onsets_per_s"]}/s · harmonic/percussive {A["harmonic_percussive_ratio"]} · voice: {A["voice"]["likely"]} ({A["voice"]["syllabic_modulation"]})',
         f'Impacts at {A["impacts"]}', f'Risers ending at {A["risers_end_at"]}', '', '| section | level | onsets/s | trend | character |', '|---|---|---|---|---|']
lines += [f'| {x["start"]}–{x["end"]}s | {x["level_db"]} dB | {x["onsets_per_s"]} | {x["trend_db_per_s"]:+} dB/s | {x["character"]} |' for x in sections]
open(os.path.join(D, 'audio.md'), 'w').write('\n'.join(lines) + '\n')
print('\n'.join(lines[:7]))
print(f'→ LOOK at {D}/audio.png')
