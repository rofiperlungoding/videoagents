# Style guide: Pulsegrid reel

Source material: none. Pulsegrid is a fictional product, so the palette and type come from `presets/pulsegrid`, and
the product UI is designed from scratch (there is no real UI to capture). No reference film: rhythm comes from the
house rules plus the UI-morph spec pattern (one container never cuts, a cursor drives every change).

## 1. Palette
| Token | Hex | Use |
|---|---|---|
| `--bg` | `#F4F2EE` | warm paper canvas, with a faint dot grid |
| `--ink` | `#111113` | headlines, UI text, the metric card |
| `--ink-2` | `#6B6A66` | labels, secondary UI text |
| `--accent` | `#2F5BFF` | the ONE accent: the live dot, buttons, the key word, the flagged data, the end card flood |
| `--card` | `#FFFFFF` | UI surfaces |
Tonal ramp of the accent only (10 % and 18 % tints) for chart fills and selection backgrounds. Data that is not the
story is ink at 20–40 %. No second hue: the anomaly is shown with the accent plus an ink outline, never red.

## 2. Type
- Display face: Geist 600, tracking -0.045em, line-height 0.95, sentence case, full stops. Hook at 230 px, captions at 112 px.
- UI face: Geist 400/500/600. UI copy ≥ 28 px at 1080p, numbers 600 with tabular figures.
- Accent colour on the second phrase / key word only ("live.", "everything.", "why.", "seconds.").

## 3. Rhythm
120 BPM, 40 beats, 10 bars. Hard state changes on bar lines (b8, b16, b24, b32, b36), inner events on beats and
half-beats. Something new at least every 2 beats (1 s). The build (b30–b35.5) accelerates into a half-beat gap, and the
end card lands on the drop at b36.

## 4. Transitions (allowed vocabulary)
- Morph: the one container changes size, radius and fill on a spring; its content leaves before and enters after.
- Rise through a mask (type), lift through the mask (type exits), collapse into what replaces it.
- Flood: the metric card grows past the frame edges and becomes the cobalt end card.
Never: crossfades, spins, glitches, light leaks, bounce on UI.

## 5. Camera
Constant micro push on holds (1.00 → 1.04), a punch-in toward the anomaly (b21), drift ≤ 4 px of seeded noise. The
camera scales; fonts never shrink below 28 px.

## 6. Texture & finish
Clean digital. Depth from layered soft shadows (contact + ambient) under white cards. No glow, no gradients on UI chrome.

## 7. Text in / out
Captions rise word by word through a mask (heavy for display, snappy for UI) and lift out upward before the next
caption lands. UI text inside the container uses swapAlpha plus a short rise. A pure opacity fade is never an enter or exit.

## 8. Sound
Synth score (music.py): intro on the hook, full groove from the button (b8), stripped "dark" under the ask panel (b24)
so typing and clicks read, build from b30, half-beat gap at b35.5, drop with crash on the end card (b36).
UI sounds: pops on appearances, clicks on every cursor press and toggle, ticks on the counter and typing, whooshes
peaking on every morph landing, a shutter on each strike-through, riser + thump into the end card.
