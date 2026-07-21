---
name: brand-assets
description: Generate Prompt Atelier brand assets (thumbnails, logos, banners, tool-UI mocks) as HTML rendered to PNG via headless Edge. Use when creating or updating any channel/site visual — YouTube thumbnails, avatars, banners, case-study figures, or mock product UIs.
---

# Prompt Atelier — Brand Asset Generation

All brand assets are **HTML files rendered to PNG** with headless Edge. Design once in
code, re-render forever. Never hand-edit a PNG — edit its HTML source and re-render.

## Design tokens (the law)

```css
/* surfaces */    --porcelain:#FBF8F2; --ivory:#F2ECE1; --ink:#1B1813; --espresso:#26221A;
/* text */        --text-ink:#211D15; --text-soft:#6B6355; --text-cream:#F6F0E4; --text-fog:#B5AC9C;
/* gold accent */ --gold:#C19A3D; --gold-deep:#8A6A24 (on light); --gold-bright:#DCBC69 (on dark);
/* secondary */   --teal:#33625C; --teal-bright:#8FC2BA; --stone:#A99D88;
/* glass */       blur 18px + saturate(140%); dark fill rgba(24,20,14,.46); border rgba(255,255,255,.26); radius 20px
```

- Fonts: **Fraunces** (serif, titles/wordmark — italics for the accent word) + **Inter** (sans, labels/captions). Load from Google Fonts.
- Wordmark: `Prompt <em>Atelier</em>` — "Atelier" always italic gold. Monogram: italic gold `P` + smaller cream italic `a`.
- **Rule of gold**: the accent appears once per composition (a numeral, an italic word, or a ring). Never large fills.
- Dark stage background (used by every dark asset):
  `radial-gradient(50% 65% at 82% 18%, rgba(193,154,61,.28), transparent 60%), radial-gradient(55% 70% at 8% 90%, rgba(51,98,92,.45), transparent 60%), linear-gradient(155deg,#16130E,#2B2418)`

## Render command (headless Edge)

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" `
  --headless=new --disable-gpu --window-size=<W>,<H> --virtual-time-budget=9000 `
  --screenshot="<absolute-out>.png" "http://localhost:8790/<file>.html"
```

- Serve the folder first (launch config `pages`, port 8790, `npx http-server . -p 8790 -c-1`). `file://` URLs are blocked in the app browser; the local server also lets pages reference real project images.
- Size the HTML exactly: `html,body{width:<W>px;height:<H>px;overflow:hidden}`.
- The PNG appears a few seconds after the process returns — wait, then check the file size. A ~33KB result is usually an error page; re-render.
- Fonts need the network: keep `--virtual-time-budget=9000` so Google Fonts land before capture.

## Asset specs

| Asset | Size | Rules |
|---|---|---|
| YouTube thumbnail | 1280×720 | Big Fraunces title (≤6 words), one gold italic phrase, subject image in a 26%-radius squircle with white edge + offset gold ring, glass chip for the hook. Under 2 MB. |
| Channel logo / avatar | 1080×1080 | Everything critical inside the inscribed **circle** (YouTube crops round). Current mark: dark squircle tile, gold hairline edge, `Pa` monogram. |
| Channel banner | 2560×1440 | All text/logo inside the centered **1546×423 safe zone** (TV/desktop/mobile crops differ). Decorative ghosts may live outside it. Under 6 MB. |
| Tool-UI mock | 1920×1080 | Plausible product chrome (window bar, panels), real project imagery inside, one accent color per tool (Claude Code: coral #D97757 · Nano Banana: banana #F7D14C · sheets: light neutral). |
| Case-study figure | flexible | Dark stage + glass panels; captions in Inter caps, gold `Fig. n` label. |

## Conventions

- Sources live next to their PNGs: `thumb-ep0N*.html`, `logo-*.html`, `banner.html`, `ep0N-video-assets/ui-*.html`.
- Per-episode web assets go in `ep0N/`; the raw archives (`Episode N*/`) never get touched.
- New episode = duplicate the closest HTML template, swap text + images, re-render. Keep filenames stable so site references survive.
- In Remotion compositions, never use CSS animations — all motion must be frame-driven (`useCurrentFrame` + sin/interpolate) or renders won't match preview.
