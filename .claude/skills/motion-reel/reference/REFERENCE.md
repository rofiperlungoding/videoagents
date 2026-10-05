# Following a reference ad closely, made for our product

Use this when the user gives a reference ("make it like this Apple ad", a YouTube/Vimeo/X link, an MP4, a screen
recording). The goal is a film that a viewer would say "feels exactly like that ad", but every word, image, UI and
colour is ours. Take the **grammar**, never the **content**.

## 1. Watch it (any agent)
```bash
python3 scripts/ref.py "<url or path/to/ref.mp4>" --name <short-name>
```
If the download fails (login wall, bot check, network policy), ask the user for the file (or a screen recording)
and run it on the path. Output lands in `refs/<name>/` (git-ignored: it is someone else's footage).

Then LOOK, in this order:
1. `contact_shots.jpg`: every shot, numbered, with its start and length.
2. `shots/sNN_in.jpg`, `sNN.jpg`, `sNN_out.jpg` for each shot: how it enters, holds and leaves. This is where the
   transition is: cut, match cut, push, morph, wipe, whip.
3. `contact_2fps.jpg`: the whole flow, to catch motion inside shots (`events` in analysis.json).
4. `shots.md` / `analysis.json`: the measurements (shot lengths in seconds and beats, pace, brightness, palette,
   music tempo, how tightly cuts sit on beats, loudness per second).

No eyes (your agent cannot open images)? Then say so and work from `analysis.json` only. Never invent what a shot shows.

## 2. Decode it into `refs/<name>/reference_map.md`
For every shot fill: **Reference does** (what moves, type size and behaviour, transition in and out, camera,
how text enters and leaves, how long it holds) and **Our version** (the same move with our product's real UI,
copy and assets). Also fill:
- **Their grammar in one paragraph**: e.g. "one idea per shot, huge centred product hero on black, slow 2 % push,
  hard cuts on downbeats, a white flash before the reveal, type in 2 lines max, last shot is logo + date".
- **Personalisation**: what changes for our product and why (our feature order, our proof point, our CTA, our
  audience), and which of their beats we drop or add.

## 3. Match the rhythm exactly, then personalise
- **Duration and tempo**: default to the reference's length and measured BPM unless the user set them. `timeline_marks.json`
  already maps every reference cut and motion event onto our beat grid (half-beat snapped). Copy the marks you keep
  into `timeline.json` and `music.sections` (or use the user's licensed track).
- **Shot count and lengths**: keep them (±1 beat). If our story needs a different number of shots, keep the
  reference's *pattern* (e.g. "3 fast, 1 long hold, 3 fast, logo").
- **Transitions**: same type at the same point. A match cut stays a match cut, now between two of our shapes.
- **Type**: same scale relationships, case, line count, weight contrast and enter/exit, set in OUR fonts.
- **Colour**: map their colour *roles* onto our tokens (their background → `--bg`, their hero colour → `--accent`,
  their text → `--ink`). Keep their contrast and light/dark rhythm; never import their exact palette as a second accent.
- **Camera**: same moves (push, orbit, rack focus faked in 2D, dolly through), same speed.
- **Sound**: same tempo, section shape (quiet intro → build → drop on the reveal) and hit density. Synthesize our own
  score at their BPM (`music.py`) unless the user supplies a licensed track. Their audio is for timing only.

## 4. Never copy
Footage, frames, product shots, logos, characters, mascots, voices, music, copy lines or taglines from the reference.
Real product UI must be OUR product's (captured with `capture.mjs`), never theirs.

## 5. Shotlist and critique
- The shotlist gets a **Reference shot** column (`ref #`) so the user can compare row by row before approving.
- In every critique round add a 9th row, **Reference fidelity** (score 1–10): put our contact sheet next to
  `refs/<name>/contact_shots.jpg` and check shot lengths, transition types, type behaviour, colour rhythm, camera and
  sound shape. 8 means a viewer would recognise the style at a glance with nothing of theirs on screen.
