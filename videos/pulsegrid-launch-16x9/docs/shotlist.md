# Shotlist: Pulsegrid reel · 20 s · 120 BPM · 40 beats · formats 16x9

STATUS: APPROVED by the user (2026-10-05), built as written.

Beats are on the measured grid (`beats.json`). One row per shot; every row lists what is NEW on screen.
Rule check: something new every 2–4 s · hook readable by frame 0–2 s · end card holds ≤ 2 s and never goes static.
Layout (16:9): captions left-aligned at x = 140 in a 620 px column; the one container lives on the right half.
Demo data throughout (fictional product).

| # | Beats | Time (s) | Shot | On-screen text (exact) | Motion (preset / transition) | SFX (timeline mark) | VO | 16:9 notes |
|---|---|---|---|---|---|---|---|---|
| 1 | 0–7.5 | 0.0–3.75 | Hook on paper. Two huge lines, word per beat. "late." is struck through in accent, drops out of its mask, "live." rises in its place, and a live dot lights up after it. | "Your metrics" / "are late." → "are live." | words rise through masks (heavy), "Your" released at b-0.4 so frame 0 reads; strike draws (snappy); "late." lifts down out, "live." rises | pop hook, hook_w2, hook_w3, hook_w4 · shutter strike · pop live · pop live_dot | — | type at x 140, 230 px, lines at y 300 / 560 |
| 2 | 7.5–8 | 3.75–4.0 | Handoff: headline lifts out upward while the live dot shoots right and grows. | — | lift through mask; dot on default spring | whoosh lands on button | — | dot travels to the stage centre (x ≈ 1290) |
| 3 | 8–10 | 4.0–5.0 | The dot lands as a cobalt pill button. Cursor enters and clicks it. Caption rises. | button "Connect data" · caption "Connect" / "everything." | morph dot → pill (default); cursor (default); press (snappy) | click click_connect | — | caption left, button right |
| 4 | 10–12 | 5.0–6.0 | Button morphs into a white Sources card: three rows (glyph + name + toggle). Toggles flip on, one per half-beat. | "Sources" · "Product events" · "Payments" · "Warehouse" · "3 connected" | morph (default); rows build skeleton → content; toggle knobs (snappy) | whoosh sources · click src_1/2/3 | — | card 760 × 470 |
| 5 | 12.5–16 | 6.25–8.0 | Card collapses into a sync pill: spinner + counter climbing, progress bar fills, then a check and "Live". | "Syncing 2,418,903 events" → "Live · 3 sources" | collapse; counter linear (seg); check draws | whoosh sync · ticks b13–14 · pop synced | — | pill 760 × 150 |
| 6 | 16–21 | 8.0–10.5 | Pill opens into the dashboard: header with live dot, three KPI tiles pop and count up, a signups line chart draws itself. Caption swaps. | "Overview · Last 14 days" · "Revenue $84.2k +12.4%" · "Active users 12,480 +8.1%" · "Signups 1,906 −18.2%" · caption "Watch it" / "live." | morph (default); tiles grow out (snappy); chart draw (seg, 2 beats) | whoosh dash · pop kpi_1/2/3 | — | dashboard 1040 × 700, right half |
| 7 | 21–24 | 10.5–12.0 | The Tuesday dip gets flagged: accent ring on the point, tooltip pops. Camera punches toward it. Cursor clicks "Ask why". | tooltip "Signups −18% · Tue" + button "Ask why" | ring + tooltip grow out (snappy); camera punch-in (heavy) | pop anomaly · click click_why | — | tooltip stays inside the card |
| 8 | 24–28 | 12.0–14.0 | Dashboard morphs into the Ask panel. The question types itself; cursor clicks send. Caption swaps. | field "Why did signups drop on Tuesday?" · caption "Ask it" / "why." | morph (default); typewriter b24.5–26.5 with caret; send press (snappy) | whoosh ask · ticks b24.5–26.5 · click send | — | panel 1000 × 560 |
| 9 | 28–32 | 14.0–16.0 | The answer builds under the question: one sentence plus a 3-bar breakdown. Cursor clicks "Create alert", which turns to "Alert on". | "iOS checkout errors caused 63% of the drop." · "iOS app 63%" "Web 24%" "Android 13%" · "Create alert" → "Alert on" | answer rises; bars grow (snappy, per half-beat); button state swap | pop answer · pop bar_1/2/3 · click click_alert · pop alert_on | — | — |
| 10 | 32–36 | 16.0–18.0 | Panel collapses into an ink metric card: a huge "3 sec" lands, "was 3 days" strikes through. Caption swaps. The music builds. | "Avg. time to answer" · "3 sec" · "was 3 days" · caption "Answers in" / "seconds." | collapse; number rises (heavy); strike (snappy); micro push | whoosh metric · pop metric_num · shutter metric_was | — | card 860 × 520 |
| 11 | 36–40 | 18.0–20.0 | End card: the metric card floods past the frame edges into full cobalt. Logo mark + wordmark rise, tagline, CTA pill; cursor drifts onto the CTA; slow push keeps it alive. | "Pulsegrid" · "Analytics that answers back." · CTA "Start free" | flood (default spring past the frame); logo rise (heavy); CTA grows out (snappy); push 1.00 → 1.05 | riser + thump end · pop cta | — | left-aligned lockup at x 140, CTA ≥ 44 px |

## Music
Synth (`music.py`, chords C G Am F, seed 2026): intro b0 · full b8 · dark b24 (typing reads) · build b30 · gap b35.5 · drop b36 (crash on the end card).

## Open questions for the user
- Name, copy and demo numbers are placeholders for a fictional product: approved as written.
