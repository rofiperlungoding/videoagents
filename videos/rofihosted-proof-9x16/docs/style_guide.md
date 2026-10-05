# Style guide: rofihosted "The Proof" (60 s, 9:16)

Sources: `brands/rofihosted/` (GUIDELINES.md, tokens/tokens.json, PUNCHLINES.md, exports/screens, assets/logo)
and `docs/reference_notes.md` (Numtera, Google, Doks.AI, NeuraFlow, LangEase, Sber).

## 1. Palette (brand tokens, exact)
| Token | Hex | Use |
|---|---|---|
| `--bg` | `#0a0b0d` | OLED canvas, every dark section |
| surface-1 / 2 / 3 | `#121316` / `#181a1e` / `#202329` | UI panels, wells, user bubbles |
| `--ink` (tx-1) | `#f7f8f8` | headlines on dark |
| tx-2 / tx-3 | `#a0a4ad` / `#686d77` | secondary words, dimmed words in a building sentence |
| `--accent` lime-2 | `#a3e635` | the ONE accent: status dot, key word, selection, glows, flood frames |
| lime-1 / lime-hi | `#bef264` / `#c8f56e` | lime text on dark / top of lime gradients |
| brand ink | `#14310a` | text on lime (never #000) |
| ok green `#4ade80` | | only inside real UI (verified badge, operational) |
Light rhythm = OLED black ↔ lime flood (the brand has no white mode, so lime plays Numtera's white sections).

## 2. Type
- **Space Grotesk 700, −0.03em**: every headline and kinetic word (display face).
- **Inter 400–600**: UI chrome and the user's words (UI face).
- Inside the product only (real UI fidelity): **Fraunces** (SOFT 60) for the assistant's voice and the memory line,
  **JetBrains Mono** for step tags, telemetry, code, the URL.
- 9:16 sizes: hero words 180–300 px, sentences 92–120 px, nothing that must be read under 34 px.
- **Reference override, approved with the brief:** kinetic type is *centred* (Numtera/Google grammar), never static:
  it always types, builds, pulls focus or is flown through.

## 3. Rhythm
112 BPM (between Numtera 108 and Doks/LangEase 118), 4/4, 28 bars = 60.0 s. One idea per 2–4 beats.
Intro bars 1–4 quiet and rising, **drop on bar 5 = "Meet rofihosted"**, proof bars 5–18, breakdown bars 19–20,
memory bars 21–22, build 23–24, climax 25–26, logo + CTA 27–28.

## 4. Transitions (allowed vocabulary)
Camera through a word · focus pull (blur → sharp) · giant motion-blurred word shrinking into place ·
3D swing-in that settles flat · match-morph (logo frame → tablet, dot → status light) · lime flood wipe from the dot ·
split screen opening from the centre · bracket collapse. No crossfades, spins, glitches.

## 5. Camera
Always moving: micro push 1.00 → 1.06 on holds, faster pushes into words, 3D tilt settles (perspective 1600 px,
rotations ≤ 22°), parallax between a blurred background layer and a sharp foreground layer.

## 6. Light & texture (cinematic, from Doks/NeuraFlow/Google)
- **Lime horizon glow**: an eclipse arc rising from the bottom edge behind hero moments.
- **Soft bloom** behind the status dot and the mark (brand token glow-brand, scaled up).
- **Glass sweep**: a 45° light band crossing panels when they land.
- **Depth of field**: large blurred words / UI behind the sharp layer.
- Film grain (seeded, 3 %) and a vignette on every frame. No generic particles; the only "particles" are the
  network nodes of the tunnel shot, connected by lines.

## 7. Text in / out
In: type-on with a lime caret, rise through a mask, focus pull, giant-to-settled. Out: fly through, lift through the
mask, collapse into the next object, flood. A pure fade is never an enter or exit.

## 8. Sound (measured from the refs: no voice, bass-heavy, minor key, steady once it drops)
Original score in A minor at 112 BPM (`scripts/score.py`): sub drone + ticking pulse + sparse piano in the intro with
a filter rise and a reverse swell; on the drop a punchy kick, clap, 16th hats, side-chained pluck bass, mallet/pluck
motif and chord stabs; impacts (boom + crash) on the drop and every section change; breakdown with piano and a soft
pad; snare roll + riser into the climax; a braam on "Host it."; final chord and the brand's **wooden bell** under the
logo. UI foley from `timeline.sfx`: typing ticks, clicks, whooshes on flights, pops, a chime when the task completes.
Master −14 LUFS (platforms normalise there; refs sat at −10…−16).
