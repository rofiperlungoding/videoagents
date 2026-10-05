# AGENTS.md: instructions for any AI coding agent

This repo is a **code-to-video studio**: product launch reels and SaaS ads made entirely in code. It works with any
agent that can run a shell and look at images: Claude Code, Codex, Cursor, Gemini CLI, Copilot agent, Aider, OpenCode…
Claude Code users also get the same pipeline as the `/motion-reel` skill. Everyone else: follow this file.

## Read first (in this order)
1. `CLAUDE.md`: the house rules (render contract, motion, look, sound). They apply to every agent, not only Claude.
2. `.claude/skills/motion-reel/SKILL.md`: the full pipeline, steps 0–10. It is plain Markdown; read it as a playbook.
3. `.claude/skills/motion-reel/reference/`: `RULES.md` (detailed rules), `ENGINE.md` (engine API + commands),
   `AUDIO.md` (music, beat grid, SFX, mix), `CRITIQUE.md` (the critic prompt + scoring).
4. A finished example to copy patterns from: `videos/pulsegrid-launch-16x9/` (`film/film.js`, `timeline.json`, `docs/`).

## Setup (once per machine)
```bash
npm install                      # playwright (node 22+)
npx playwright install chromium
pip install -r requirements.txt  # numpy scipy soundfile librosa pillow
npm run doctor                   # checks node, ffmpeg, python libs, chromium
npm test                         # 5-second smoke render → videos/_test-*/renders/16x9.mp4
```
Also needed: `ffmpeg` on PATH.

## Make a film
```bash
npm run new -- videos/<distinctive-slug> --preset presets/<brand>    # scaffold (refuses an existing folder)
cd videos/<slug>                                                      # every pipeline command runs from here
```
Then follow SKILL.md: brief → (assets via `node scripts/capture.mjs <url>`) → style guide → beat grid →
**shotlist, then STOP and get the user's explicit OK** → build `film/film.js` → ≥ 3 critique rounds until every
score ≥ 8 → 60 fps final → deliver. Brand presets live in `presets/` (`blank` documents every field).

## Where Claude-only features appear, do this instead
| SKILL.md says | Any agent |
|---|---|
| "ask in ONE AskUserQuestion round" | Ask every missing input in one chat message, as a numbered list with defaults. |
| "spawn a fresh subagent" as the critic | Use your agent's subagent/second-session feature if it has one; otherwise run `reference/CRITIQUE.md` yourself, judging only rendered images and `metrics.json`, and write "critic: self" in `docs/review_log.md`. |
| "Fish Audio MCP" for voiceover | Use it if your agent has that MCP server; otherwise skip VO or ask the user for recorded takes in `audio/vo/`. |
| "Read the images" / "LOOK at the sheet" | Open the PNG/JPG with your agent's image viewer. If your agent cannot see images, say so; never score a round you could not look at. |

## Hard rules (the ones agents break most)
- The film is a pure function of time: `window.seek(t)`. No `Math.random`, timers, CSS transitions, `requestAnimationFrame`
  or state carried between frames. Verify once: `node scripts/render.mjs --verify` (must say 12/12 identical).
- Every sound is declared in `timeline.json` `sfx` (by mark, in beats). After editing the timeline: `node scripts/sync.mjs`.
- Motion uses the closed-form springs (`C.sp`, `C.spHit`, `C.trk`, `TYPE.rise`). Nothing fades in or out as an enter/exit.
- Never redraw a real product's UI from imagination: capture it (`scripts/capture.mjs`). Invented UI only for fictional products.
- Judge from renders (`render.mjs --sheet`, `--draft`, `review.py`), never from reading the code.
- Don't show the user a film before the critique verdict is SHIP.

## Make it better: give it a reference
The biggest quality jump is a reference ad. Put a video you admire in `videos/<slug>/refs/` (or a link the user gives),
extract frames (`ffmpeg -i refs/ref.mp4 -vf fps=2 refs/frames/f_%03d.jpg`), and write its rhythm, transitions and
type behaviour into `docs/style_guide.md` before the shotlist. Take its grammar, never its content.
Prompts for every stage are in `prompts/` (01–14, the director's brief template and the critique scorecard).

## Repo map
| Path | What |
|---|---|
| `CLAUDE.md` | House rules (all agents) |
| `AGENTS.md` | This file |
| `.claude/skills/motion-reel/` | Pipeline: `SKILL.md`, `engine/` (seek(t) engine), `scripts/` (render, audio, review), `templates/`, `reference/` |
| `presets/` | Brand presets (`blank`, `lukas-yt`, `pulsegrid`) |
| `prompts/` | Stage-by-stage prompts |
| `videos/<slug>/` | One folder per film. Committed: source, docs, `renders/<fmt>.mp4`, contact sheet, poster. Ignored: drafts, review kits, audio stems (regenerate with the scripts) |
| `install.sh` | Installs the skill for Claude Code (`~/.claude/skills`); other agents don't need it |
