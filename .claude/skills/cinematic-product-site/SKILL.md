---
name: cinematic-product-site
description: Build an award-style "3D scroll" product website — an AI hero image, three Seedance video clips (orbit / macro / exploded), Topaz-upscaled, extracted to frames and scroll-scrubbed on a canvas with Lenis + GSAP. Use when making a cinematic scroll-driven landing page for any physical product (watch, sneaker, fragrance, headphones, bottle) via the Kie.ai API.
---

# Cinematic Product Site — Kie.ai → Seedance → scroll-scrub

The house method for a luxury product page where **scrolling rotates the product**. One
generated hero image anchors identity; three ~8s clips are rendered from it, upscaled, cut
to JPEG frame sequences, and painted to a `<canvas>` driven by scroll position. Everything
is code — no video editor, no 3D artist.

Reference build: **FORGE & FUMÉE "Solstice"** (Episode 08). Working pipeline lives in
`solstice/` (site) and its `scripts/kie-watch.mjs` (generation CLI).

## The law of consistency

Generate **ONE hero image first**, then pass its URL as `reference_image_urls` on *every*
clip. This is what keeps the product identical across shots. A slightly softer clip where
the product is identical reads more expensive than four gorgeous clips of four different
products. Never skip the reference.

## Kie.ai models & billing (200 credits = $1)

| Step | Model ID | Notes | Cost @ our settings |
|---|---|---|---|
| Hero image | `seedream/5-pro-text-to-image` | `quality:"high"` (2K), `aspect_ratio:"16:9"` | 14 cr |
| Video clip | `bytedance/seedance-2` | `resolution:"720p"`, `duration:8`, `generate_audio:false` | 328 cr / clip |
| Upscale | `topaz/video-upscale` | `upscale_factor:"2"` → downscale to 1080p in ffmpeg | ~64 cr / 8s clip |

Render at **720p and upscale 2×** — it costs less than half of native 1080p (102 cr/s vs
41 cr/s) and, for a scroll-scrubbed canvas, is visually indistinguishable. Do **not** drop
to 480p for products whose detail is the pitch (engraving, texture) — upscalers cannot
invent detail that was never rendered. Check balance with `GET /api/v1/chat/credit`.

## API shape

All jobs: `POST https://api.kie.ai/api/v1/jobs/createTask` with
`{ model, input }` and `Authorization: Bearer $KIE_API_KEY`; then poll
`GET /api/v1/jobs/recordInfo?taskId=…` until `data.state === "success"`; result URLs are in
`data.resultJson` (`resultUrls`). Image-to-video clip input:

```json
{ "model": "bytedance/seedance-2",
  "input": { "prompt": "…", "reference_image_urls": ["<hero-url>"],
             "resolution": "720p", "aspect_ratio": "16:9",
             "duration": 8, "generate_audio": false } }
```

The `scripts/kie-watch.mjs` CLI wraps this with a resumable state file
(`outputs/state.json`) so takes are never lost:

```
node scripts/kie-watch.mjs check                         # credit balance
node scripts/kie-watch.mjs image --take 1                # hero image (14 cr)
node scripts/kie-watch.mjs choose-image --take 1         # lock the winner
node scripts/kie-watch.mjs clip --name orbit --take 1    # 328 cr
node scripts/kie-watch.mjs choose-clip --name orbit --take 1
node scripts/kie-watch.mjs upscale --name orbit          # Topaz 2x → 1080p
node scripts/kie-watch.mjs frames --name orbit --fps 15  # → JPEG sequence
```

Video jobs take minutes — run them with `run_in_background: true` and review a **contact
sheet** (`ffmpeg -i clip.mp4 -vf "select=not(mod(n\,32)),tile=3x2" sheet.jpg`) before
approving. Spend extra takes only on the hero-orbit clip; it is ~80% of the effect.

## The three shots (works for any product with parts)

1. **HERO ORBIT** — a slow, perfectly smooth 360° turntable in a void, one dramatic rim
   light, faint drifting atmosphere. This is the scroll-scrub hero. Must return to its
   start angle so the loop is seamless.
2. **MACRO FLY-THROUGH** — extreme close-up glide across the product's signature surface.
3. **EXPLODED ASSEMBLY** — components float apart, then converge into the finished piece;
   the **final frame must land identical to the hero image** (it hands off to the next
   section). Judge the last frame hardest.

Always end prompts with "no readable text, no logos, no captions" — the brand name lives in
the site typography, not baked into the footage (AI garbles engraved text).

## The scroll-scrub site

- **Frame sequence on canvas.** Extract each upscaled clip to ~120 JPEGs
  (`fps=15, scale=1600:-2, qscale:v 3`). A `manifest.json` maps `seq → count`; the section
  height (e.g. `#hero{height:480vh}`) sets scroll length; a `.pin-viewport{position:sticky}`
  holds the canvas while a GSAP `scrub` tween advances `state.frame` 0→count-1, redrawn with
  `drawImage` (cover-fit, center).
- **Lenis** for smooth scroll, fed into `ScrollTrigger.update` via `gsap.ticker`.
- **Overlays ride the footage.** Story beats and spec cards are glass panels
  (`backdrop-filter: blur`) that fade in *and out* on scrub-locked timelines
  (`data-at` / `data-out`) — content floats over the film, never in flat standalone bands.
- **Editorial bands** between scrubs use a full-bleed still as a parallax background with a
  gradient scrim; pinned-section tops/bottoms fade to the page bg so seams disappear.
- **Preload with a real percentage**; first frame paints before the rest stream in.
- **Readability is non-negotiable**: quiet label text ≥ ~4.5:1 on the dark base, and any
  scroll-revealed text must have a fallback (reduced-motion + failed-trigger guard) so it
  can never stay at opacity 0. See `solstice/js/main.js` `forceRevealAll()`.

## Verify before "done"

The app's Browser pane suspends `requestAnimationFrame` when hidden, so a naive scroll test
reads as "frozen." Verify scrubs by **manually pumping the clock**:

```js
const s = performance.now();
for (let i=0;i<90;i++){ lenis.raf(s+i*16.7); gsap.updateRoot((s+i*16.7)/1000); }
ScrollTrigger.update();
```

Then hash a canvas row at three scroll depths and assert ≥2 unique frames per sequence, and
that counters/reveals reach their end state. Confirm zero console errors.

## Credit budget (reference build)

Hero image + 3 clips + 3 upscales + one comfortable retake ≈ **1,500–1,850 credits (~$8–10)**.
Card art for the case study is harvested free from the frames already rendered — never
re-generate a still you can crop from footage you own.
