# Reference notes: what we take from each ad

Studied from the MP4s the user supplied (5) and YouTube storyboards (NeuraFlow, 1 frame/s), with
`scripts/ref.py` (shots, cuts, motion, palette) and `scripts/ref_audio.py` (loudness, tempo, key, sections, impacts).
Raw analyses live in `refs/<name>/` (git-ignored: their footage). We take grammar, never content.

## Measured at a glance
| Ref | Length | Shots / cuts | Visual events/s | Music | Key | Loudness | Voice | Spectrum |
|---|---|---|---|---|---|---|---|---|
| Numtera (AI SaaS launch) | 95 s | 14 shots, mean 6.8 s | 1.36 | 108 BPM, very steady pulse | Bb minor | -10.0 LUFS, LRA 2.1 | none | 69 % bass 60–250 Hz |
| Google Montage | 72 s | 7 shots, mean 10.3 s | 1.58 | 129 BPM | G major | -12.3 LUFS, LRA 5.4 | none | warm (centroid 0.8 kHz) |
| Doks.AI | 20 s | 8 shots, mean 2.5 s | 1.29 | 118 BPM | A minor | -16.0 LUFS | none | 52 % bass, 29 % sub |
| LangEase | 33 s | 1 continuous take | 1.30 | 118 BPM | E minor | -13.8 LUFS | none | 55 % bass |
| Sber (9:16 short) | 13 s | 4 shots | 2.11 | 129 BPM | G minor | -10.2 LUFS | none | 55 % sub |
| NeuraFlow (storyboard only) | 20 s | ~6 | — | not heard | — | — | — | — |

**Takeaways.** Nobody cuts much: energy comes from continuous motion (morphs, camera through type, panels
swinging in) at 1.3–2.1 changes per second. Nobody uses a voice. Every soundtrack is bass-heavy electronic
at 108–129 BPM in a minor key (except Google), loud and steady once it starts.

## Shared musical arc (from the spectrograms, `refs/*/audio.png`)
1. **Quiet intro that rises** (Numtera 0–8.5 s, Google 0–44 s): sparse, filtered, ticking, no full beat.
2. **The drop lands on the brand name** (Numtera "Meet Numtera" at 8.5–10 s, Google beat at 44.5 s).
3. **Steady dense loop under the product proof**, impacts every 2–8 bars on section changes (Doks every ~2 bars).
4. **A dropout / breakdown before the end** (LangEase 16.5 s, Numtera "And…" moment).
5. **Final hits and a decaying tail under the logo** (LangEase stutter hits 29–32 s, all refs ring out over 2–3 s).

## Numtera: the main model for "The Proof"
- Typewriter with caret on a clean field; a phrase gets **highlighted like a text selection**; blurred UI fragments float at depth.
- **Camera dives through a word** ("investigation…") into the next idea; **"Stop" starts out of focus and pulls sharp**.
- On the drop: **giant motion-blurred "Meet"** shrinks and settles, the brand name arrives in the accent, the **icon pops between the words**.
- **Sentences build word by word** while the camera pulls back ("The AI-powered self-learning support OS").
- **UI panels swing in from a 3D tilt**, then flatten; **glass light-sweeps** cross them; **macro zooms onto UI text**.
- **Split screen: UI | dark log panel** with steps appearing one by one ("Connected… Scanning memory… Verified source found… Resolved").
- **Bracket keywords** `[ Reusable knowledge ]` whose brackets later collapse to `[ ]`; a **"learning…" progress bar blown up huge**.
- **Contrast pair**: "They close tickets" (plain) → "We Eliminate them" (accent, zooms in huge then settles).
- Ending: icon pops, wordmark types beside it; on black a **typewriter writes the tagline, deletes it, writes the CTA**, URL small below.
- Rhythm: white and deep-blue sections alternate; one idea per ~1.5 s.

## Google Montage
- Dark field, **constellation of dots connected by lines** that draw between words ("What if a search engine could think…").
- **Coloured light blooms** drifting behind the type; **a search bar with a glowing gradient border** as the hero object.
- Contrast copy: **"Even 10 questions" → "in 1 question"**. Long warm piano/pad intro, beat only at 44 s.

## Doks.AI and NeuraFlow (closest to our palette: dark + one bright accent)
- **Horizon / eclipse glow**: a bright arc of light rising from the bottom edge behind the title; NeuraFlow adds a **light beam from above**.
- UI tilted in 3D over the glow; a **hero glyph** (a star) floats, spins once, becomes the logo; end card = logo on the horizon glow.

## LangEase and Sber
- LangEase: one continuous take; words alone on white ("Turn" → "Books" → "Audio"), phones flying in perspective,
  **progress 95 → 100 then "Done"**, cursor clicks a CTA, sparkle glyph → triple line "Translate. Dub. Distribute.", logo hold.
- Sber (9:16): UI cards stacked and floating in 3D, **one-word captions at the bottom**, a new card every ~1 s.

## Translated to rofihosted (what we keep → our version)
| Their move | Our version |
|---|---|
| Typewriter + selection highlight | "Your AI lives on someone else's server." with "someone else's server" selected in lime |
| Camera through a word, "Stop" focus pull | dive through "server." → "Stop renting." pulls into focus |
| Giant blurred "Meet" → name + icon pops between | "Meet" → **mark pops** → "rofihosted" in Space Grotesk, on the drop |
| Hero glyph + horizon glow (Doks, NeuraFlow) | the **status dot** of our logo is the hero; a **lime horizon glow** rises behind it |
| Sentence builds while camera pulls back | "A personal AI server" → "on one tablet." |
| UI panel swings in from 3D tilt, glass sweeps | the **tablet** and the **phone UI** swing in, with a lime-tinted glass sweep |
| Split screen UI ‖ dark log | phone composer ‖ **live activity steps** (WEB / PAGE / MEMORY / SANDBOX with times) |
| `[ bracket keyword ]` | `[ verified ]`, `[ isolated ]`, `[ yours ]` |
| "learning…" bar blown up | `compiling in isolated sandbox…` bar blown up, then 1.3 s ✓ |
| Contrast pair | "They rent you the cloud." → "**We put it on your desk.**" |
| Constellation lines (Google) | tablet node ↔ phone ↔ laptop through the **Cloudflare Tunnel**, lines drawing |
| Typewriter tagline → CTA on black | "One tablet. A real server.|" → "rofihosted.space|" |
| Dark ↔ light rhythm | OLED black ↔ **lime flood** frames (ink text on lime) |
