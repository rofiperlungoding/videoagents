# Brief

Preset: `pulsegrid` (Pulsegrid — fictional analytics SaaS (demo)). Fields it did not fill still say `?`.

Fill every field before building. `?` means "ask the user". A default is used only if the user says "your call".

| Input | Value | Default if "your call" |
|---|---|---|
| Product | Pulsegrid | — (required) |
| URL | none: fictional product. No capture step; the UI is designed from scratch in film.js | — (required; the source of real UI, fonts and colours) |
| One-line promise | Live product analytics that tells you why a number moved. | the site's H1, shortened |
| Audience / platform | Social feed + landing page (16:9), sound on but readable sound-off | social feed (sound-off readable) |
| Duration (s) | 20 | 15–20 |
| Formats | 16x9 | 16x9 + 9x16 (also available: 1x1, 4x5) |
| Brand colours | bg #F4F2EE, ink #111113, ink2 #6B6A66, accent #2F5BFF, card #FFFFFF | measured from the site (capture.mjs) → one accent |
| Fonts | display: Geist · UI: Geist | the site's own faces (capture.mjs downloads them) |
| Reference film | none: rhythm from the house rules + the UI-morph spec pattern (one container never cuts) | none: rhythm from the house rules |
| Music | synth | `synth` (scripts/music.py) or a supplied file path |
| Voiceover | none | none, or Fish Audio (voice id / name) |
| CTA / end card | Start free | "Try it at <domain>" |
| Must show | connecting data sources, a live dashboard, asking why a metric dropped and getting the answer | the 3 features the site leads with |
| Must avoid | real company names or logos (integrations are generic), claims presented as real customer data | — |

## Messages, in order
1. Your metrics are late. Pulsegrid makes them live.
2. Connect every source, watch the dashboard update live, and when a number moves, ask why and get the answer.
3. Start free.

## Notes
- Fictional product: every number on screen is demo data. Never present it as a real customer result.
- One container never cuts: the live dot from the hook becomes the button, the sources card, the dashboard, the ask panel, the metric card and finally the cobalt end card.
- A cursor drives every UI change with a real click.
- Integrations are generic (Product events, Payments, Warehouse) with simple glyphs, never third-party logos.
