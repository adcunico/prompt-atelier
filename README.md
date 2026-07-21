# Prompt Atelier

**The tools are free. The taste is the craft.**

The complete source for the [Prompt Atelier](https://youtube.com/@promptatelier) project — a
YouTube channel and website where everything (the videos, the graphics, the site, even the
thumbnails) is produced with AI tools and assembled with code, then documented as case studies.

## What's here

| Path | What it is |
|---|---|
| `index.html` | The website landing page |
| `case-study-ep01.html` | Case Study 01 — an AI avatar video made entirely with free tools |
| `case-study-ep02.html` | Case Study 02 — a Pixar-style podcast produced from one spreadsheet by an AI agent |
| `design-system.html` | Prompt Atelier design system v1.0 (palette, type, glass, layouts) |
| `prompt-atelier-video/` | Remotion project — both videos are code (`npm i && npm run studio`) |
| `thumb-*.html`, `logo-*.html`, `banner.html` | Brand assets as HTML → rendered to PNG with headless Edge |
| `ep02-video-assets/` | Tool-UI mocks used in the Case Study 02 video |
| `.claude/skills/brand-assets/` | The Claude Code skill that documents the asset pipeline |

## The stack

Claude Code (orchestration) · Remotion (programmatic video) · ElevenLabs (voice) ·
SadTalker + Google Colab (Ep 01 lip-sync) · Nano Banana + Veo (Ep 02 imagery & motion) ·
Fraunces + Inter · zero editing software.

## Serve locally

```bash
npx http-server . -p 8790
# → http://localhost:8790
```

Built in the open with [Claude Code](https://claude.com/claude-code).
