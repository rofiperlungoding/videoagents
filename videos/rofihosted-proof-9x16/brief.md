# Brief

Preset: `rofihosted` (rofihosted (brand kit 1.0)). Fields it did not fill still say `?`.

Fill every field before building. `?` means "ask the user". A default is used only if the user says "your call".

| Input | Value | Default if "your call" |
|---|---|---|
| Product | rofihosted | — (required) |
| URL | https://rofihosted.space | — (required; the source of real UI, fonts and colours) |
| One-line promise | A personal server and AI assistant running entirely on a single tablet. | the site's H1, shortened |
| Audience / platform | Reels / Shorts / TikTok (9:16), devs and students, sound on | social feed (sound-off readable) |
| Duration (s) | 60 | 15–20 |
| Formats | 9x16 | 16x9 + 9x16 (also available: 1x1, 4x5) |
| Brand colours | bg #0a0b0d, ink #f7f8f8, ink2 #a0a4ad, accent #a3e635, card #181a1e | measured from the site (capture.mjs) → one accent |
| Fonts | display: Space Grotesk · UI: Inter | the site's own faces (capture.mjs downloads them) |
| Reference film | ? | none: rhythm from the house rules |
| Music | synth | `synth` (scripts/music.py) or a supplied file path |
| Voiceover | none | none, or Fish Audio (voice id / name) |
| CTA / end card | rofihosted.space | "Try it at <domain>" |
| Must show | the tablet as a real server, the real UI (composer, live activity steps, verified file card, memory), the logo mark with its status dot | the 3 features the site leads with |
| Must avoid | cheesy buzzwords (revolutionary, blazing fast, magic), pure black #000 on lime, generic SaaS purple/blue, rainbow or cyan logo fills | — |

## Messages, in order
1.
2.
3.

## Notes
- Tone: quiet confidence. State the physical reality (one tablet, a real server), never hype.
- Lime #a3e635 (gradient top #c8f56e) is the only accent; text on lime is brand ink #14310a, never pure black.
- Fonts: Space Grotesk 700 for headlines, Inter for UI, Fraunces for the assistant's voice, JetBrains Mono for telemetry and step tags.
- Use the real UI from brands/rofihosted/exports/screens or rebuild it element by element from cc.css / app.css.
- Signature details: spark glyph cycle · ✢ ✳ ✶ ✻ ✽, 'Simmering for Rofi…' shimmer, step tags WEB / PAGE / SANDBOX / MEMORY, '3/3 links verified ✓'.
- Sound: minimalist cinematic electronica, sub-bass, piano, tactile clicks, a soft wooden bell when a turn completes.
