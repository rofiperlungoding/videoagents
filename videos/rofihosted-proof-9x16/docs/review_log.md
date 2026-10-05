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
# Review log: rofihosted "The Proof" (9:16, 60 s)

Critic: run inline by the building agent in the critic's voice (this session does not spawn subagents unless the user asks).
Display face changed to Inter Tight before round 1 at the user's request ("Apple-like"); Fraunces kept (user's choice).

## Round 1: renders/draft_9x16.mp4 (30 fps draft), review/r1/*, sheet_9x16

| Criterion | Score | Evidence (timestamps, frame numbers, metric values) |
|---|---|---|
| Hook (first 2 s) | 7 | f0 already shows "You" + caret; by 2.0 s "Your AI lives on / someone else'" reads, but the lime selection (the payoff) only lands at 3.1 s. |
| Readability at phone size | 5 | phone_9x16 26–36 s: request bubble, step rows (mono 29 px) and file card are ~10 px at 360 px wide; memory rows (36 px) at 47–49 s and the uptime card sub-lines are illegible. HUD mono 34 px at 17–20 s is ~11 px. |
| Motion quality | 7 | strip_fast (7.1–7.47 s): the dive through "server." scales cleanly with blur into the lime cut; strip_fast2: "Meet" settles with weight. The phone shot has no camera movement for 12 s apart from the badge zoom. |
| Variety / pacing | 8 | max gap 2.57 s (rule 2–4 s); longest static 1.3 s at 30.6 s; lime/black rhythm at 7.5, 37.5, 54.1 s. |
| Brand accuracy | 8 | real mark (fixed mask ids) and the real wordmark SVG in the reveal and lockup; UI rebuilt in English from the real screens; one accent; ok-green only inside the real status UI. |
| Sound sync | 7 | 19/25 hits within 45 ms, mean 41 ms at 30 fps (one frame is 33 ms); HUD 4 click +100 ms at 20.09 s. Mix −14.0 LUFS, true peak −1.1 dBTP. |
| Composition | 6 | the phone panel's lower half is empty at 26–37 s; "And / it remembers you." sits in the top third with the bottom two thirds black for 1.6 s (45–46.6 s); the same for "They rent you the cloud." at 49.3–51.5 s. |
| Reference fidelity | 7 | Numtera grammar is there (typewriter + selection, dive through a word, giant "Meet", word build, brackets, contrast pair, macro zoom), but Numtera's macro zooms move constantly over the UI and ours holds the phone wide. |
| Polish | 6 | near_blank_frames: 3 frames at 50.77 s (gap between "They…" leaving and "We…" landing). |

**3 worst problems**
1. Phone UI unreadable at 360 px (26–37 s): the camera holds the whole phone wide, so every UI line is ~10 px.
2. Empty bottom two thirds while the headline holds (45–46.6 s, 49.3–51.5 s) and the empty phone panel below the steps.
3. Three near-blank frames at 50.77 s: "They" exits 0.3 beat before "We" can read.

**Fixes for round 2**
1. Phone camera follows the active UI region at 1.3–1.45× (composer → steps → file card → badge), UI type +10–15 %, a top scrim behind the captions; HUD mono 34 → 40 px; memory rows 36 → 42 px. Verify: phone_9x16 at 26–37 s readable.
2. "And / it remembers you." and "They / We" groups start centred and rise to the top as their cards arrive. Verify: sheet beats 84–87 and 92–96 have no empty two thirds.
3. "They" exit moves to we − 0.12 beat. Verify: review.py near_blank_frames empty.

**Verdict:** ANOTHER ROUND

## Round 2: renders/draft_9x16.mp4, review/r2/*

Round 1 fixes checked: (1) phone camera now follows the UI at 1.1–1.15× plus a +45 % badge zoom, so "2/3 links verified" reads at 33 s in phone_9x16; (2) "And…" and "They…" start centred and rise when their cards land (46–47 s, 49–51 s); (3) near_blank_frames is now empty.

| Criterion | Score | Evidence |
|---|---|---|
| Hook (first 2 s) | 7 | unchanged: the lime selection (the line's point) still lands at 3.1 s; at 2 s the sentence is mid-typing. |
| Readability at phone size | 7 | captions, headlines and the request bubble read at 360 px; the step rows (mono 32 px × 1.14) are still ~12 px at 29–31 s; the URL on the end card is ~20 px tall, smaller than the headlines. |
| Motion quality | 8 | the phone camera now moves through the UI on heavy springs (26–37 s); the dive, giant "Meet", the flood and the slams all have weight; no pops in strip_fast / strip_fast2. |
| Variety / pacing | 8 | max gap 2.67 s; longest static 1.27 s. |
| Brand accuracy | 8 | as round 1. |
| Sound sync | 7 | 19/25 within 45 ms at 30 fps; HUD 4 +100 ms (20.09 s). Mix −14.0 LUFS, TP −1.1 dBTP. |
| Composition | 8 | no third of the frame empty for more than a beat outside the deliberate "Meet" hold. |
| Reference fidelity | 8 | Numtera's macro moves through the UI are in; the hook typing is slower than Numtera's (selection at 3.1 s vs ~2 s). |
| Polish | 8 | near_blank_frames empty; brackets hug "verified"; no stray carets. |

**3 worst problems**
1. Hook payoff late: the selection lands at 3.1 s.
2. Step rows ~12 px at 360 px (29–31 s).
3. End card: the URL is the least legible line in the closing shot (59 s), and HUD 4's line reads 100 ms late (20.09 s).

**Fixes for round 3**
1. Type faster: line 1 −0.5→2.25, line 2 2.5→4.25, selection 4.5 (= 2.4 s); typing SFX moved with it.
2. Step rows: 36 px mono in 84 px rows, shorter detail strings so they fit.
3. URL 62 → 78 px, lockup scales to 0.8 instead of 0.68; HUD lines draw with a 2-frame lead.

**Verdict:** ANOTHER ROUND

## Round 3: renders/draft_9x16.mp4, review/r3/*, plus per-element sync (node scripts/sync_roi.mjs, 60 fps)

Round 2 fixes checked: (1) the selection now sweeps at 2.4 s (phone_9x16 frame 2 s already shows it half-way); (2) step rows are 37 px in 86 px rows (31 s); (3) URL 78 px, lockup at 0.8; HUD labels now hit on the click (sync_roi −3…+5 ms).

| Criterion | Score | Evidence |
|---|---|---|
| Hook (first 2 s) | 8 | f0 shows "You" + caret; the full line and the lime selection over "someone else's server." land by 2.4 s, with blurred rent fragments behind. |
| Readability at phone size | 8 | every caption, headline, the request bubble, "2/3 links verified" (macro zoom), the notification, memory rows and the URL read at 360 px; the step rows and tablet telemetry stay texture-sized behind captions that carry the message. |
| Motion quality | 8 | heavy-spring camera through the UI, giant-to-settle "Meet"/"And"/"We", the dive into "server." and into the phone node, the lime flood from the dot; no pops in strip_fast / strip_fast2; motion blur on the finals. |
| Variety / pacing | 8 | max gap 2.67 s; longest static 1.73 s at 2.5 s (the typing hold, caret blinking); black/lime rhythm at 7.5, 37.5, 54.1 s. |
| Brand accuracy | 8 | the real mark (squircle + notched status dot) and the real wordmark SVG; UI rebuilt in English from the real screens; one accent; Inter Tight display (user override), Inter UI, Fraunces + JetBrains Mono inside the product only. |
| Sound sync | 8 | sync_roi: 19/25 within ±45 ms at 60 fps. Of the other six: "first key" has no before-frame (t = 0); "3/3 verified" and "compiled check" read on the cue frame in frame-by-frame stills (the metric caps at 150 ms under continuous camera motion); "1/3 verified" and "file card lands" include the deliberate pre-move of the camera and the activity-card collapse; "$20 / month" is +48 ms. Mix −14.0 LUFS, TP −1.3 dBTP. |
| Composition | 8 | no third of the frame empty for more than a beat outside the "Meet" and "Host it." holds, which carry the horizon glow. |
| Reference fidelity | 8 | Numtera's grammar point by point (typewriter + selection, dive through a word, focus-pull "Stop", giant "Meet", word build, brackets, split activity log, macro zoom, contrast pair, typewriter end card), Doks/NeuraFlow horizon glow, Google constellation; our copy, UI and colour throughout. |
| Polish | 8 | near_blank_frames empty; no carets left after their lines; brackets hug their words; no glyph slivers at the masks in the strips. |

**Residual (known, accepted):** step rows and tablet telemetry are texture at 360 px; "$20 / month" pop +48 ms.

**Verdict:** SHIP (every score ≥ 8, 3 rounds)
