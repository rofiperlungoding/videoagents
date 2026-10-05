# 15 · Follow a reference ad, made for our product

Paste into any agent (Claude Code, Codex, Cursor, Gemini CLI…), filling the brackets:

```text
Read AGENTS.md and .claude/skills/motion-reel/reference/REFERENCE.md.

Make a [DURATION]-second [16:9 | 9:16 | 1:1] ad for [PRODUCT] ([URL]).
Reference: [YouTube/Vimeo/X link or path to the video].
Follow the reference closely: same shot lengths, order of beats, transitions, camera moves, type behaviour,
colour rhythm and music shape. Make everything on screen ours: real UI captured from our site, our words,
our fonts, our colours mapped onto their colour roles. Copy nothing of theirs (footage, logos, copy, music).

1. Scaffold with npm run new, capture our site, run scripts/ref.py on the reference.
2. LOOK at every reference shot, fill refs/<name>/reference_map.md, write docs/style_guide.md from it.
3. Show me the shotlist with a "ref #" column and wait for my OK.
4. Build, critique (Reference fidelity is a scored row) until every score is 8+, render the final.
```
