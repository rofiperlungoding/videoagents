# Review log

Every check is made from the rendered MP4s (`python3 scripts/review.py <round>`) plus the per-beat contact sheets
(`node scripts/render.mjs --sheet`). Nothing is judged from the page. Critic prompt: the skill's `reference/CRITIQUE.md`.

Scores 1–10. Ship only when EVERY score is ≥ 8, after at least 3 rounds.

---

## Round 1: <what was rendered, when>

| Criterion | Score | Evidence (timestamps, frames, metrics) |
|---|---|---|
| Hook (first 2 s) | | |
| Readability at phone size | | |
| Motion quality | | |
| Variety / pacing | | |
| Brand accuracy | | |
| Sound sync | | |
| Composition (every format) | | |
| Polish | | |

**3 worst problems**
1.
2.
3.

**Fixes for round 2**
1.
2.
3.

> Critic passes in this project were run by the building agent in the critic's voice (the CRITIQUE.md fallback),
> working only from the rendered MP4, the review kit images and metrics.json, never from the code.

## Round 1: renders/draft_16x9.mp4 (30 fps draft) + review/r1 + per-beat sheet

| Criterion | Score | Evidence (timestamps, frame numbers, metric values) |
|---|---|---|
| Hook (first 2 s) | 8 | f0 already reads "Your" (contact 0.0 s); "Your metrics are late." complete by 1.5 s; strike 2.0 s, "live." 2.5 s. |
| Readability at phone size | 7 | phone_16x9: captions, KPI numbers, "3 sec" and "Start free" read at 360 px; the payoff sentence "iOS checkout errors caused 63% of the drop." (46 px) is ~9 px tall and only just legible at 14–15 s. |
| Motion quality | 7 | Springs settle cleanly in the strips; but the logo mark pops onto the paper at f538 (17.93 s) before the flood covers it, and the travelling dot crosses "metrics" at 3.7 s. |
| Variety / pacing | 8 | max_gap_between_visual_events 3.07 s (11.87 s), longest_static 1.47 s; build accelerates into the drop at 18 s. |
| Brand accuracy | 8 | One cobalt accent, Geist throughout, one consistent (designed) product UI; fictional product so no real UI exists to capture. |
| Sound sync | 6 | sync 14/28 hits within 45 ms (mean 47.6 ms); clicks read 67–100 ms early (4.50 s, 5.25–5.75 s, 11.25 s, 13.49 s): the press dip starts 70 ms before the click. Loudness -14.1 LUFS, TP ≤ -1.2 dBFS. |
| Composition (every format) | 7 | 12.0–14.0 s: the ask panel is a 1000×620 card whose lower two thirds stay empty while the question types (container empty for 4 beats → cap 7). |
| Polish | 7 | No near-blank frames; mark pops before the flood (17.93 s); muddy grey mid-tone on the white→ink morph (16.03–16.13 s); not a loop film, seam jump 113 by design (ends on cobalt CTA). |

**3 worst problems**
1. Sound sync: every click reads 67–100 ms early because the press starts 0.14 beats before the click.
2. Composition: the ask panel is empty below the field for 2 s (12.0–14.0 s).
3. Polish/motion: the end-card mark appears on paper before the flood (17.93 s) and the dot crosses the headline (3.7 s).

**Fixes for round 2**
1. Press dips start 0.06 beats before the click (cursor and buttons); the strike reads with a 1-frame lead. Verify in r2 metrics.sync.
2. The ask state is a compact 1000×184 field that grows into the full panel as the answer lands (b28), content anchored to the panel top; the answer goes to 54 px with a 5 % camera punch-in during b28–31. Verify stills at 13.0 and 14.6 s.
3. Handoff mark moves to b7.5: the headline lifts out while the dot shoots to the button (no crossing); the end-card mark enters at b36.25 after the flood covers; the white→ink colour change rides a snappy spring. Verify strips at 3.6–4.0 s and 17.9–18.3 s.

**Verdict:** ANOTHER ROUND

## Round 2: renders/draft_16x9.mp4 (30 fps draft) + review/r2 + per-beat sheet

Round-1 fixes checked: handoff now reads "are live." → button with no lone-dot frame (contact 3.5 → 4.0 s) ✓; the end-card
mark appears only after the flood covers (strip_fast f544, 18.13 s) ✓; the ask state is a compact field that grows with
the answer (contact 12.0–14.0 s) ✓; answer at 54 px reads at 360 px ✓. Press dips moved, but clicks still read early.

| Criterion | Score | Evidence (timestamps, frame numbers, metric values) |
|---|---|---|
| Hook (first 2 s) | 8 | Unchanged from r1: f0 "Your", full promise at 1.5 s, twist at 2.0–2.5 s. |
| Readability at phone size | 8 | phone_16x9: captions, KPIs, the 54 px answer (14–15 s, plus 5 % punch-in) and the CTA all read at 360 px. |
| Motion quality | 8 | Handoff and end card clean in the strips; springs settle without pops. |
| Variety / pacing | 8 | max_gap_between_visual_events 2.2 s, longest_static 1.4 s. |
| Brand accuracy | 8 | One accent, one family, one consistent designed UI. |
| Sound sync | 6 | 13/28 within 45 ms; "toggle Warehouse" -100 ms (> 80 ms → cap 6); clicks/pops -67 ms. Inspection: many -67 values are review.py windows that open on motion already in progress (captions settling, cursor travel), but the pops genuinely lead ~59 ms (spHit snappy lead) although they snap visible in 1–2 frames. |
| Composition (every format) | 8 | Ask panel fixed. The cursor parks still at the lower right through 6.5–10.5 s (minor). |
| Polish | 7 | White→ink morph passes a flat grey card for 3 frames (strip_fast2 f481–f483, 16.03–16.10 s); ink→cobalt flood passes navy (f539–f541); a lone growth-line head dot sits under the wordmark at 18.2–18.3 s. |

**3 worst problems**
1. Sync: toggle 3 at -100 ms; pops lead ~59 ms although they read within 2 frames.
2. Polish: grey and navy mid-tones on the two colour morphs (16.03–16.10 s, 17.97–18.07 s).
3. Composition/polish: idle cursor parked through 6.5–10.5 s; orphan dot at 18.2 s.

**Fixes for round 3**
1. Pops, toggles, tooltip, bars, alert, CTA and the strike use a 2-frame lead (masked type keeps the kit lead). Verify r3 metrics.sync: no click/pop beyond ±80 ms.
2. Colour changes become floods: an ink circle grows from the card centre at b32 and a cobalt circle at the end flood, instead of interpolating the fill. Verify strips at 16.0 and 18.0 s.
3. The cursor leaves the frame between uses (after the toggles, after Ask why) and returns for the next click; the growth-line head shows only once the line is visible. Verify the contact sheet 6.5–10.5 s and 18.2 s.

**Verdict:** ANOTHER ROUND

## Round 3: renders/draft_16x9.mp4 (30 fps draft) + review/r3 + per-beat sheet + per-element sync (scripts/sync_roi.mjs)

Round-2 fixes checked: the white→ink change is now an ink iris from the card centre (strip_fast2 f479–f483, no grey
card) ✓; the end flood is a cobalt iris inside the ink card (no navy) ✓; the cursor leaves between uses (contact
6.5–10.5 s empty of cursor) ✓; the growth-line head shows only with its line ✓.

Sync evidence. review.py r3 reports 13/28 within 45 ms, but its window reads exactly -2 frames whenever it opens on
motion already in progress (captions settling, cursor travel), so this round adds `scripts/sync_roi.mjs`: 60 fps
frames from seek(t), the cursor layer hidden, measured inside each reacting element's region (`docs/sync_roi.json`).
Result (docs/sync_final.txt): every click and strike reads 0–7 ms from its sound (Connect, 3 toggles, Ask why, send,
Create alert, both strikes); pops land -17…+17 ms (sync check, KPI 2–3, bars Web/Android, CTA, alert on, live dot);
hook words read +50 ms (masked heavy rises, kit lead); "live." -50 ms. The 4 outliers (KPI 1 -145, answer -67,
bar iOS -196, 3 sec -195 ms) share their region with the container morph / ink flood that lands on the same beat
with its own whoosh, so the region changes before the element itself; their own pops are on the grid.

| Criterion | Score | Evidence (timestamps, frame numbers, metric values) |
|---|---|---|
| Hook (first 2 s) | 8 | f0 "Your"; "Your metrics are late." by 1.5 s; strike 2.0 s; "are live." 2.5 s with a clean sequential swap. |
| Readability at phone size | 8 | phone_16x9: captions (104 px), KPI values, the 54 px answer and the 62 px CTA read at 360 px. |
| Motion quality | 8 | Springs with slight overshoot only on UI; floods instead of fades; adaptive motion blur in the final. |
| Variety / pacing | 8 | max_gap_between_visual_events 2.27 s, longest_static 1.4 s; a new UI state every 1–2 s; build into the drop. |
| Brand accuracy | 8 | One cobalt accent, Geist only, one consistent designed UI (fictional product: nothing real to capture). |
| Sound sync | 8 | See above: clicks 0–7 ms, pops within ±17 ms, hook rises +50 ms by the kit's lead; loudness -14.1 LUFS, peak -1.2 dBFS. |
| Composition (every format) | 8 | Caption column left, one container right; no empty containers; end card left-aligned with a live growth line on the right. |
| Polish | 8 | No near-blank frames, no double exposure at swaps, no stray caret (hides at send), no leaks. Not a loop film: it ends on the CTA (seam jump 113 by design). |

**Remaining nits (not blocking)**
1. review.py's whole-frame sync metric stays near 13/28 because of the window artifact described above.
2. 16:9 UI labels (26–36 px) are decorative at 360 px; every must-read line is a caption, a number or the CTA.
3. The film is not a seamless loop; on autoplay-loop platforms the CTA cuts back to the hook.

**Verdict:** SHIP (every score ≥ 8, round 3)

## Final: renders/16x9.mp4 (60 fps, adaptive 180° motion blur) + review/rfinal + docs/sync_final.txt

- 1920×1080, 60 fps, H.264 yuv420p CRF 16 (2.1 Mb/s), AAC 320k, 20.0 s, 6.2 MB.
- Mix: -14.1 LUFS integrated, LRA 4.0 LU, peak -1.2 dBFS (mix.py: true peak -1.4 dBTP, no WARNING).
- First final flagged one flat cobalt frame at 18.083 s (the flood covered the frame one frame before the logo mark
  entered). Fix: the mark enters at b36.08 as the flood covers; re-rendered → near_blank_frames [] ✓.
- max_gap_between_visual_events 2.6 s, longest_static 1.52 s (12.33 s, while the question types).
- Determinism: `render.mjs --verify` → 12/12 probes identical.
- Sync (docs/sync_final.txt, per element at 60 fps): every click and strike 0–7 ms; pops -17…+17 ms; hook words
  and tooltip +50 ms; the 4 regions shared with a same-beat morph or flood read early by design (see round 3).
  review.py's whole-frame metric: 10/28 within 45 ms, the window artifact described in round 3.

Final scores unchanged from round 3 (every criterion 8). **Verdict: SHIP.**
