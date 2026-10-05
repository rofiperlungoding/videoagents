# rofihosted · Brand Identity & Design System Manual

> **Version:** 1.0 (2026-10-05)  
> **Source of Truth:** `apps/web/public/cc.css`, `apps/web/public/app.css`, `apps/web/public/logo.svg`  
> **Target Standard:** Apple / Google Tier High-End Craftsmanship

---

## 1. Brand Story & Philosophy

### 1.1 The Premise
Most modern AI infrastructure demands exorbitant cloud subscriptions, black-box tracking, and endless remote compute dependencies. 

**rofihosted** inverts this entirely:
> *"One tablet. A real server."*

An ordinary Samsung Galaxy Tab A8, sitting quietly on a student desk in a kos room, transformed into an unyielding 24/7 autonomous Linux server, model gateway, and personal AI assistant. Reached securely through Cloudflare Tunnels without any public open ports, serving its owner and invited friends with private memory and sovereign compute.

### 1.2 Core Pillars

| Pillar | Principle | Manifestation in Design |
|---|---|---|
| **Quiet Confidence** | No aggressive neon shouting, no generic SaaS purple/blue. | Deep OLED blacks (`#0a0b0d`), subtle warm gray surfaces, and a curated electric lime (`#a3e635`) that signifies life and energy without eye strain. |
| **Tactile Craft** | Interfaces should feel physical and touchable, not paper-flat. | Subtle top-edge light reflection (`--cc-edge-light`), directional ambient sheens, recessed input wells (`--cc-well`), and tactile clay buttons. |
| **Literary Intelligence** | The assistant is not a cold terminal script; it is a thoughtful companion. | The assistant speaks in a variable soft serif (**Fraunces Variable**), creating an immediate visual separation between mechanical system UI and reasoned thought. |
| **Sovereign Privacy** | True personal memory that survives across conversations. | Dedicated Memory settings, transparent oversight audit trails, and isolated Alpine container execution for untrusted code. |

---

## 2. Logo & Geometric Anatomy

The rofihosted visual mark is a pure geometric glyph designed on a 64×64 pixel grid.

```
       0                      46        64
    0  ┌───────────────────────┬─────────┐
       │     rx = 16 (25%)     │  (Notch)│
       │                       ▼  r=9.5  │
       │     ┌─────────────┐   ╭──╮      │
       │     │ x=16, y=16  │   │  │ ● ◄──┼─ Status Dot (r=5.0)
       │     │ w=32, h=32  │   ╰──╯      │  Heartbeat / the "i"
       │     │ stroke = 7  │             │
       │     │ rx = 10     │             │
       │     └─────────────┘             │
       │   Squircle Frame: the Tablet    │
   64  └─────────────────────────────────┘
```

### 2.1 The Two Symbolisms
1. **The Frame:** The rounded rectangle represents both the physical tablet chassis standing in landscape mode and the letter `o` in *rofihosted*.
2. **The Notched Dot:** The cutout on the top-right corner cradles an orbiting solid circular dot. It represents both the `i` in *rofi* and the server's pulsating status light.

### 2.2 Mathematical Specifications
* **Tile:** Width `64`, Height `64`, Corner Radius `rx = 16` (exactly 25% squircle corner rounding).
* **Tile Fill:** Linear gradient from `#c8f56e` (top, 0%) to `#a3e635` (bottom, 100%).
* **Cutout Mask:** Circle centered at `cx = 46`, `cy = 18` with radius `r = 9.5`.
* **Frame:** Centered at `x = 16`, `y = 16`, dimensions `32 × 32`, corner radius `rx = 10`, stroke width `7`, stroke color `#14310a`.
* **Dot:** Centered at `cx = 46`, `cy = 18` with radius `r = 5.0`, fill color `#14310a`.
* **Ink Rule:** On lime backgrounds, stroke and dot color MUST be organic dark ink (`#14310a`), **never** pure black (`#000000`).

### 2.3 Clear Space & Minimum Sizes
* **Clear Space:** Maintain a minimum perimeter clearance equal to **0.5M** (where M is the width of the mark). No text, borders, or graphics may enter this boundary.
* **Minimum Digital Size:**
  * Primary Tile: `20 × 20 px`
  * Favicon: `16 × 16 px`
  * App Icon: `64 × 64 px` to `1024 × 1024 px`
* **Wordmark Construction:** Set in **Space Grotesk Variable Bold (700)**, letter spacing `-0.02em`. In horizontal lockup, the wordmark cap-height is aligned with the center axis of the mark, spaced at `0.3125M` gap.

### 2.4 Logo Misuse (Do's and Don'ts)
* ❌ **DO NOT** skew, stretch, or rotate the logo.
* ❌ **DO NOT** replace the lime gradient with generic rainbow or neon cyan fills.
* ❌ **DO NOT** use pure black (`#000000`) for the frame or dot on the lime tile; use `#14310a`.
* ❌ **DO NOT** add harsh drop shadows directly to the SVG stroke; use the official glow tokens (`--cc-glow-brand`).
* ✅ **DO** use the monochrome white mark (`mark-mono-white.svg`) when printing on physical paper or merchandise.
* ✅ **DO** use the OLED Dark Icon (`app-icon-dark.svg`) on mobile home screens and dark status bars.

---

## 3. Color Architecture & Tokens

The color system is organized into functional roles rather than arbitrary aesthetic choices. All values are hardcoded in `brand/tokens/tokens.json`.

### 3.1 Palette Table

| Token Name | HEX | RGB | HSL | Contrast vs `#0a0b0d` | Usage & Purpose |
|---|---|---|---|---|---|
| `--cc-bg` | `#0a0b0d` | `10, 11, 13` | `220°, 13%, 5%` | — | Deepest app canvas, OLED baseline |
| `--cc-surface-1` | `#121316` | `18, 19, 22` | `225°, 10%, 8%` | — | Sidebar, dialog body, file card container |
| `--cc-surface-2` | `#181a1e` | `24, 26, 30` | `220°, 11%, 11%` | — | Elevated cards (`.cc-card`), menus |
| `--cc-surface-3` | `#202329` | `32, 35, 41` | `220°, 12%, 14%` | — | Active hover states, user message bubbles |
| `--cc-brand-1` | `#bef264` | `190, 242, 100` | `82°, 84%, 67%` | **15.07 : 1** | Primary brand text, hyperlinks, active icons |
| `--cc-brand-2` | `#a3e635` | `163, 230, 53` | `83°, 78%, 55%` | **13.06 : 1** | Primary button base, focus rings, send action |
| `--cc-tx-1` | `#f7f8f8` | `247, 248, 248` | `180°, 6%, 97%` | **18.51 : 1** | High-contrast primary reading text |
| `--cc-tx-2` | `#a0a4ad` | `160, 164, 173` | `222°, 7%, 65%` | **7.88 : 1** | Secondary UI labels, navigation, explanations |
| `--cc-tx-3` | `#686d77` | `104, 109, 119` | `220°, 7%, 44%` | **3.79 : 1** | Placeholders, timestamps, borders, meta |
| `--cc-ink` | `#14310a` | `20, 49, 10` | `105°, 66%, 12%` | **9.45 : 1** (on Lime) | Text and iconography on lime buttons |
| `--cc-ac` | `#4ade80` | `74, 222, 128` | `142°, 69%, 58%` | **11.30 : 1** | Operational status, verified links, success |
| `--cc-tle` | `#fbbf24` | `251, 191, 36` | `43°, 96%, 56%` | **11.79 : 1** | Warning, latency notices, 429 backoff |
| `--cc-wa` | `#fb7185` | `251, 113, 133` | `351°, 95%, 71%` | **7.32 : 1** | Errors, broken links, destructive actions |
| `--cc-border` | `rgba(255,255,255,0.08)` | — | — | — | Universal 1px structure boundary |

---

## 4. Typography Hierarchy

rofihosted uses **four specialized font families**, all fully self-hosted as WOFF2 in `brand/assets/fonts/`.

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Space Grotesk Variable (Display / Headlines / Brand)      │
│    "One tablet. A real server."                              │
├─────────────────────────────────────────────────────────────┤
│ 2. Inter Variable (UI Sans / Navigation / User Words)       │
│    "Check my unread email · Settings · Search (Ctrl+K)"     │
├─────────────────────────────────────────────────────────────┤
│ 3. Fraunces Variable (Thoughtful Serif / Assistant Voice)   │
│    "Sudah kuperiksa 3 paper ilmiah dan tautannya verified." │
├─────────────────────────────────────────────────────────────┤
│ 4. JetBrains Mono Variable (Telemetry / Code / Step Tags)   │
│    [SANDBOX] gcc fcfs.c -o fcfs (1.315s) · RSS: 2.44 MB     │
└─────────────────────────────────────────────────────────────┘
```

### 4.1 Typography Roles & Settings

1. **Space Grotesk Variable (`--cc-font-display`)**
   * **Weights:** `600`, `700`.
   * **Letter Spacing:** `-0.02em` to `-0.035em`.
   * **Role:** Brand logo lockup, page hero headers, modal titles.

2. **Inter Variable (`--cc-font-sans`)**
   * **Weights:** `400` (Regular), `500` (Medium), `600` (Semi-bold).
   * **Role:** UI labels, inputs, sidebar links, button copy, user chat messages (`.msg-user`).

3. **Fraunces Variable (`--cc-font-serif`)**
   * **Axes:** `font-variation-settings: "SOFT" 60, "WONK" 0`.
   * **Optical Sizing:** `auto`.
   * **Role:** Every answer delivered by the assistant (`.msg-assistant`), home greetings ("Evening, Rofi"), status headlines.

4. **JetBrains Mono Variable (`--cc-font-mono`)**
   * **Role:** Code blocks (`pre code`), log streams, keyboard shortcuts (`<kbd>Ctrl K</kbd>`), elapsed turn timers, step tags (`WEB`, `PAGE`, `MEMORY`, `SANDBOX`).
   * **Features:** `font-variant-numeric: tabular-nums`.

---

## 5. Tactile UI Material System

rofihosted relies on deliberate depth to build tactile intimacy.

### 5.1 Elevation Levels
* **E1 (Subtle Lift):**  
  `box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 1px 2px rgba(0, 0, 0, 0.45);`  
  *Usage:* Badges, pills, secondary buttons, sidebar active rows.
* **E2 (Card Surface):**  
  `box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 4px 14px rgba(0, 0, 0, 0.40);`  
  *Usage:* Hovered cards, message composer box.
* **E3 (Floating Modal):**  
  `box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07), 0 14px 36px rgba(0, 0, 0, 0.50);`  
  *Usage:* Settings dialog, popovers, invitation welcome card.

### 5.2 Recessed Wells (`.cc-well`)
* **Shadow:** `inset 0 2px 5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.03)`
* **Usage:** Text input boxes, search bar, progress bar tracks, summary recap containers. Gives the visual impression of being carved into the device chassis.

### 5.3 Clay Primary Button (`.cc-btn-primary`)
* **Background:** `linear-gradient(180deg, #c8f56e, #a3e635)`
* **Shadow:** `inset 0 1px 0 rgba(255, 255, 255, 0.45), 0 6px 18px rgba(163, 230, 53, 0.22)`
* **Text Color:** `#14310a` (Brand ink)
* **Hover Interaction:** `transform: translate3d(0, -1px, 0); box-shadow: inset 0 1px 0 rgba(255,255,255,.5), 0 10px 24px rgba(163,230,53,.3);`
* **Press Interaction:** `transform: translate3d(0, 1px, 0); box-shadow: inset 0 1px 0 rgba(255,255,255,.3), 0 3px 8px rgba(163,230,53,.18);`
* **GPU Compositing:** Uses `transform: translateZ(0); will-change: transform` to avoid text jitter during variable-font rendering.

### 5.4 Liquid Glass Acrylic (`.cc-glass`)
* **Backdrop:** `backdrop-filter: blur(24px) saturate(120%);`
* **Background:** `rgba(24, 26, 30, 0.6)`
* **Reflection Sheen:** `linear-gradient(135deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0) 42%)`
* **Accessibility Fallback:** Switches to solid `var(--cc-surface-2)` when `prefers-reduced-transparency: reduce` is detected.

---

## 6. Signature Motion & Animation

In rofihosted, animations communicate machine state, effort, and responsiveness.

### 6.1 Easing Curves
```
--cc-ease:        cubic-bezier(0.22, 1.00, 0.36, 1.00); /* Smooth deceleration */
--cc-ease-spring: cubic-bezier(0.34, 1.40, 0.50, 1.00); /* Tactile pop / spring */
```

### 6.2 Timing Tiers
* **Duration 1 (Micro-feedback):** `150ms` (Hover, button clicks, icon highlights).
* **Duration 2 (Transitions):** `240ms` (Flyout menus, dropdowns, card lifts).
* **Duration 3 (Entrance/Exit):** `380ms` (Dialog reveals, page loads, toast appearances).

### 6.3 The Assistant Heartbeat (Activity Line)
1. **The Spark Glyphs:**  
   During generation, the leading character cycles continuously through 10 glyphs at `120ms` per frame:  
   `·  →  ✢  →  ✳  →  ✶  →  ✻  →  ✽  →  ✻  →  ✶  →  ✳  →  ✢`  
   When the turn completes, the spark rests permanently as `✻` with a muted opacity of `0.6`.
2. **The Thinking Verbs:**  
   The assistant uses 10 artisanal verbs:  
   `Pondering`, `Brewing`, `Simmering`, `Tinkering`, `Assembling`, `Weighing`, `Weaving`, `Tracing`, `Concocting`, `Noodling`.  
   Every third verb incorporates the user's name: *"Simmering for Rofi…"*.
3. **The Shimmer Sweep:**  
   The active verb features a 1.8-second linear infinite background gradient sweep clipped to text.
4. **Pulsing Step Tag:**  
   Active steps in progress breathe at `1.4s` infinite loop (`opacity: 0.35` to `1.0`).

---

## 7. Tone of Voice & Copywriting

rofihosted has a distinct, confident, human persona:

### 7.1 Rules of Tone
1. **Direct and Results-First:** Never open an answer with an empty preamble like *"Sure! I would be delighted to assist you with that query."* Deliver the answer or file immediately, followed by brief assumptions.
2. **Bilingual Elegance:**
   * **System Interface & Menus:** Clean, minimalist English (*"New chat"*, *"Settings"*, *"Jump back in"*, *"Verified ✓"*).
   * **Operational & Local Conversations:** Casual, polite, natural Indonesian (*"Sudah kucek 3 paper terbaru..."*, *"Ini file Word-nya ya"*).
3. **No Cheesy Marketing Buzzwords:** Never say *"Revolutionary AI supercomputer"*, *"Unmatched power"*, or *"Blazing fast magic"*. State the physical reality: *"A personal server and AI assistant running entirely on a single tablet."*

---

## 8. Video Advertisement Production Guide

When producing SaaS commercial videos or product reveal clips for rofihosted, follow these production rules to achieve the **Apple / Google hardware commercial** aesthetic:

* **Cinematography:** Low-key studio lighting with dark slate surfaces. A warm desk lamp or soft window backlight. Deep depth of field with 50mm or 85mm prime lenses focusing on the Samsung Galaxy Tab A8's matte bezel and glowing screen.
* **Color Grade:** Crushed deep blacks, cold neutral grays, with the screen's electric lime (`#a3e635`) illuminating the user's fingers.
* **Foley & Sound Design:**
  * Crisp tactile mechanical keyboard clicks.
  * Subtle sub-bass rumble when the server supervisor boots.
  * Soft organic wooden bell chime when a background turn completes.
* **Screen Capture:** Use the 2K exported PNGs or screen-record `brand/showcase/ui-screens.html?z=1` directly in Chromium at 60 FPS for flawless rendering.
