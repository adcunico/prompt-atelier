# Lumen — Generative Studies

An original collection of twelve creative-coding pieces built with vanilla
JavaScript and the raw Canvas 2D API — no frameworks. Techniques were first
explored in Bruno Imbrizi's Domestika course *Creative Coding 2.0 in JS*,
then reimagined and rebuilt from scratch here.

## Run it

```
npm install
npm run dev
```

Then open http://localhost:5173.

## The pieces

| Piece | Descended from | What's new |
|---|---|---|
| **Tessellate** | `sketch-skew` | Seeded compositions, curated palettes, simplex-noise drift, glow + vignette lighting, live sliders, PNG export |
| **Silk** | `sketch-curves` | Curve terrain carved from a photograph's luminance, animated simplex wind, springy mouse ripple, luminance-mapped color |
| **Ember** | `sketch-particles` | Full-color particles (original was monochrome) sampled from your photos, spring physics, pointer brush, Shatter/reform, trails + glow |
| **Resonance** | `sketch-audio` / `sketch-audio-2` | Radial frequency arcs + waveform ring, log-spaced bands with fast-attack/slow-release smoothing, three inputs: mic, drag-and-drop audio, or a local track |

A second set of four, inspired by techniques across [brunoimbrizi.com](https://www.brunoimbrizi.com/) (boids experiments, flow-field work, branching structures, sphere meshes) but designed and written from scratch:

| Piece | Technique | The twist |
|---|---|---|
| **Murmuration** | Flocking (separation / alignment / cohesion) with a spatial hash | Click toggles the pointer between predator (scatters) and lure (orbits); heading + speed mapped to palette so the flock shimmers as it turns |
| **Undertow** | Simplex flow field steering long-lived ink particles | Trails are permanent — the piece etches itself over minutes; "Develop" mode reveals one of your photographs through the currents |
| **Bloom** | Real-time recursive branch growth with noise curvature | Click to plant a garden; seeded Regrow replays it; music drive makes growth surge with the track and blossoms pulse on bass |
| **Meridian** | Hand-rolled 3D: fibonacci sphere, rotation + perspective projection, no libraries | Drag to spin with inertia, simplex storms ripple the surface, bass breathing via the music drive |

A third set of four, sparked by a fellow student's repo from the same course
([GMBermeo/Visuals-with-Javascript_Canvas-Sketch](https://github.com/GMBermeo/Visuals-with-Javascript_Canvas-Sketch)) — their starburst, agents, noise-grid and typographic final projects, rebuilt our way:

| Piece | Inspired by | The twist |
|---|---|---|
| **Halo** | Their radial starburst final project | Seeded mandala with a **symmetry dial** — 1.0 is a perfect kaleidoscope, 0 lets every slice go feral; slow orbital drift and breathing |
| **Tether** | Their agents final project (movement was commented out) | We switched the motion on: bouncing constellation, proximity threads colored by closeness, twinkling stars, pointer gravity that gathers or pushes on click |
| **Weave** | The course noise-grid sketch | Palette rides the same noise that turns the strokes, and the lattice is **combable** — the pointer parts it like fur |
| **Glyph** | Their katakana portraits of paintings | Your own photos in four charsets (Katakana / Latin / Digits / brightness-ordered Density), three colour voices, and a live shimmer that keeps the portrait quietly retyping itself |

## Assets

- Put images in `assets/images/` and register them in `src/lib/images.js`.
- For the course track, drop `track.mp3` into `assets/audio/`
  ("big-city-lights" by ikoliks / Artlist — licensed, so not bundled).

## Structure

- `src/lib/` — shared toolkit: seeded random, simplex noise, palettes,
  sketch runner (DPR-aware canvas + RAF loop), control panel UI, image utils
- `src/<piece>.js` + `<piece>.html` — one pair per piece
- `src/gallery.js` — live miniature previews on the landing page
