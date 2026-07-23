# The Solstice — Episode 08

A cinematic, scroll-scrubbed product site for **FORGE & FUMÉE**, a fictional bronze
tourbillon watch. Scrolling rotates the watch: the hero section paints a Seedance video
clip frame-by-frame onto a `<canvas>`, driven by scroll position via GSAP ScrollTrigger +
Lenis. Glass overlays ride the footage; editorial bands sit on full-bleed stills.

Live: [promptatelier.uk/solstice](https://www.promptatelier.uk/solstice/) ·
Case study: [Episode 08](../case-study-ep08.html)

## How it was made

1. **Hero image** — one prompt to `seedream/5-pro-text-to-image` (the identity anchor).
2. **Three clips** — `bytedance/seedance-2` at 720p, each referencing the hero image:
   hero orbit, macro fly-through, exploded assembly.
3. **Upscale** — `topaz/video-upscale` 2× → 1080p.
4. **Frames** — FFmpeg cuts each clip to ~120 JPEGs; the site scrubs them on a canvas.

All generation runs through the Kie.ai API. The `scripts/kie-watch.mjs` CLI orchestrates it
with a resumable state file; prompts live in `prompts/`. Provide your own `KIE_API_KEY` in a
`.env` (never committed). Full method: the `cinematic-product-site` skill in
`.claude/skills/`.

## Run locally

```bash
npx serve . -l 4173   # → http://localhost:4173
```

Built with [Claude Code](https://claude.com/claude-code). The tools are affordable — the taste is the craft.
