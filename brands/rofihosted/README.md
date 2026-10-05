# rofihosted · Brand Identity & SaaS Commercial Assets

This directory contains the complete, authoritative Brand Identity and Commercial Video Production kit for **rofihosted**.

Every asset, color value, typographic rule, and motion parameter here is derived with pixel precision directly from the production application (`apps/web/public/` and `ubuntu/conf/index.html`).

---

## 📂 Directory Structure

```
brand/
├── README.md                      ← You are here
├── GUIDELINES.md                  ← Master brand book (philosophy, anatomy, colors, typography, do's/don'ts)
│
├── assets/                        ← Ready-to-use production assets
│   ├── logo/                      ← Master vector SVGs and PNG rasterizations
│   │   ├── mark.svg               ← Primary lime squircle logo (exact match with apps/web/public/logo.svg)
│   │   ├── mark-flat.svg          ← Single-tone lime mark
│   │   ├── app-icon-dark.svg      ← OLED dark squircle icon with ambient radial glow
│   │   ├── lockup-horizontal.svg  ← Mark + "rofihosted" wordmark (Space Grotesk 700) for dark backgrounds
│   │   ├── lockup-horizontal-on-light.svg ← Horizontal lockup for light paper/printing
│   │   ├── lockup-stacked.svg     ← Centered vertical lockup
│   │   ├── glyph-lime.svg         ← Raw vector glyph (no tile container) in electric lime
│   │   ├── glyph-white.svg        ← Raw vector glyph in crisp white
│   │   ├── mark-mono-black.svg    ← Monochrome dark mark
│   │   ├── mark-mono-white.svg    ← Monochrome light mark
│   │   └── png/                   ← High-res PNG renders (1024px, 512px, 192px, 64px, 32px)
│   ├── fonts/                     ← Self-hosted variable font files (WOFF2)
│   │   ├── space-grotesk-latin-wght-normal.woff2  (Brand Display)
│   │   ├── inter-latin-wght-normal.woff2          (UI Sans)
│   │   ├── fraunces-latin-full-normal.woff2       (Assistant Serif)
│   │   └── jetbrains-mono-latin-wght-normal.woff2 (Code & Telemetry)
│   ├── cc.css                     ← Design system tokens and tactile Soft-UI stylesheet
│   └── app.css                    ← App layout & component rules
│
├── tokens/                        ← Machine-readable design tokens
│   ├── tokens.json                ← JSON tokens (surfaces, lime accents, elevations, radii, motion)
│   └── contrast.json              ← Automated WCAG contrast verification ratios
│
├── showcase/                      ← Interactive browser design showcases
│   ├── brand-board.html           ← Interactive Brand Board (live swatches, typography sliders, tactile buttons)
│   ├── ui-screens.html            ← Pixel-perfect 1:1 reproduction of all product screens
│   └── showcase.css               ← Layout scaffolding for browser presentation
│
├── exports/                       ← Rendered production stills
│   └── screens/                   ← 2K PNG screenshots of every product view (01-home to 11-mobile)
│
├── video-ad-kit/                  ← High-end SaaS commercial advertisement production tools
│   ├── SCRIPT_AND_STORYBOARD.md   ← 30s & 60s Apple/Google style scripts, shot lists, lighting & audio cues
│   └── motion-specs.json          ← Precise cubic bezier points, durations, and frame rates for After Effects / Remotion
│
└── tools/                         ← Automated node generation scripts
    ├── build-logos.mjs            ← Builds and rasterizes all logo variants from exact SVG geometry
    └── render-screens.mjs         ← Screen-captures all showcase frames into 2K crisp stills
```

---

## 🚀 How to View & Use

### 1. View the Interactive Brand Board & UI Screens
Simply open the HTML files in any modern browser:
* **Interactive Brand Board:** Double-click or open `brand/showcase/brand-board.html` in your browser.
* **UI Screens Showcase:** Open `brand/showcase/ui-screens.html` (append `?z=1` to view at 100% native resolution).

### 2. High-Res Screen Captures for Video Editing
In `brand/exports/screens/`, you will find ready-to-import 2K PNG screen captures for Premiere Pro, DaVinci Resolve, or Final Cut Pro:
* `01-home.png` — Greeting screen with serif headline, central composer, and suggestions.
* `02-conversation.png` — Completed turn with academic citations, file card, and link verification badge.
* `03-live-activity.png` — Live thinking state with shimmering verb and active sandbox execution.
* `04-settings-memory.png` — Sovereign memory settings and preferences.
* `05-login.png` & `06-invitation.png` — Google OAuth and "You're in." welcome screens.
* `07-landing.png` & `08-status.png` — Public landing page and 90-day uptime monitor.
* `09-mobile-home.png` & `10-mobile-conversation.png` — High-density mobile phone viewports.

### 3. Re-generating Logos or Screenshots
If you ever adjust the app's stylesheets or SVG vectors, regenerate everything with:
```bash
node brand/tools/build-logos.mjs
node brand/tools/render-screens.mjs
```
*(Requires Playwright from your local environment to measure variable typography and rasterize at 2x retina scale).*

---

## 🎨 Design System Quick Cheat Sheet

* **Primary Dark Background:** `#0a0b0d`
* **Card Elevation 1:** `#181a1e` with sheen `linear-gradient(180deg, rgba(255,255,255,0.035), transparent 38%)`
* **Electric Lime Core Accent:** `#a3e635` (gradient top: `#c8f56e`)
* **Brand Ink (Text on Lime):** `#14310a` (Never pure black `#000000`)
* **Primary Reading Text:** `#f7f8f8`
* **Assistant Voice Typography:** `Fraunces Variable` (Serif with `SOFT 60, WONK 0`)
* **Brand Display & Wordmark:** `Space Grotesk Variable Bold (700)` with `-0.02em` tracking
* **System UI & Labels:** `Inter Variable`
* **Telemetry & Step Tags:** `JetBrains Mono Variable`
