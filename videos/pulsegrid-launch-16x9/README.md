# Pulsegrid: 20 s launch ad (16:9)

A motion-graphics SaaS ad made entirely in code with the Motion Reel Kit (`/motion-reel`). Pulsegrid is a
**fictional** analytics product, and every number on screen is demo data.

- **Final:** `renders/16x9.mp4` (1920×1080, 60 fps, adaptive motion blur, H.264 CRF 16, AAC 320k, -14 LUFS)
- **Contact sheet / poster:** `renders/contact_16x9.jpg`, `renders/poster.png`
- **Story:** `docs/shotlist.md` (approved) · **look:** `docs/style_guide.md` · **critique rounds:** `docs/review_log.md`

## How it is built
- `timeline.json` is the single source of truth: 120 BPM, marks in beats, every sound effect declared by mark.
- `film/film.js` holds the whole picture as a pure function of time (`window.seek(t)`). A single container never cuts:
  the live dot after "live." becomes the Connect button, the sources card, the sync pill, the dashboard, the ask
  panel and the metric card, then it floods the frame as the cobalt end card. A cursor drives every change.
- `scripts/music.py` synthesizes the score, `scripts/sfx.mjs` the UI sounds, and `scripts/mix.py` masters to -14 LUFS.
- `scripts/sync_roi.mjs` (added in this project) checks per-element sync at 60 fps against the regions in
  `docs/sync_roi.json`. It complements `review.py`'s whole-frame metric (see round 3 in the review log).

## Re-render (from this folder)
```bash
node scripts/sync.mjs                         # after any timeline.json change
python3 scripts/music.py && python3 scripts/beats.py audio/music.wav --stem audio/drums.wav && node scripts/sync.mjs
node scripts/sfx.mjs && python3 scripts/mix.py
node scripts/render.mjs --sheet               # one frame per beat → review/sheets/
node scripts/render.mjs --draft && python3 scripts/review.py 4 --draft
node scripts/render.mjs                       # 60 fps final → renders/16x9.mp4
node scripts/render.mjs --fmt 9x16            # other formats need a 9:16 layout pass in film.js first
```
Preview in a browser: open `film/index.html?play` through any static server from this folder
(`npx serve .`, then go to `/film/index.html?play`) and click to play with the mix.

## Make it yours
The copy, colours, numbers and UI live in `film/film.js` (top of file: palette, layout, `SERIES`, `KPI`, `SOURCES`)
and `timeline.json` (timing). For a real product, start a fresh project with your own preset instead:
`/motion-reel 20-second launch reel for https://your-site.com in 16:9, use presets/<your-brand>`.
