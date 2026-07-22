// TESSELLATE — a field of skewed, glowing slabs on a seeded grid.
// Descended from the course "skew" sketch; rebuilt with curated palettes,
// simplex-driven drift, vignette lighting and PNG export.
import { createNoise } from './lib/noise.js';
import { PALETTES, rgba } from './lib/palettes.js';
import { createRandom } from './lib/random.js';
import { createPanel } from './lib/panel.js';
import { createSketch, exportPNG } from './lib/sketch.js';

const canvas = document.getElementById('canvas');
const noise = createNoise(11);

const params = {
  palette: PALETTES[0],
  seed: Math.floor(Math.random() * 100000),
  cols: 9,
  rows: 12,
  skew: -30,          // degrees
  chaos: 0.5,         // rotation + width variance
  fillChance: 0.55,
  drift: true,
  driftAmount: 0.6,
};

let slabs = [];

function generate() {
  const rand = createRandom(params.seed);
  slabs = [];
  for (let j = 0; j < params.rows; j++) {
    for (let i = 0; i < params.cols; i++) {
      slabs.push({
        u: (i + 0.5) / params.cols,
        v: (j + 0.5) / params.rows,
        w: rand.range(0.35, 1.6),
        h: rand.range(0.24, 0.6),
        rot: rand.gaussian(0, 0.35) * params.chaos,
        color: rand.pick(params.palette.colors),
        fill: rand.chance(params.fillChance),
        phase: rand.value() * 100,
        jx: rand.gaussian(0, 0.012),
        jy: rand.gaussian(0, 0.012),
      });
    }
  }
}
generate();

function render(ctx, { width, height, time }) {
  const pal = params.palette;

  // background with a soft radial light
  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, width, height);
  const glow = ctx.createRadialGradient(
    width * 0.5, height * 0.42, 0,
    width * 0.5, height * 0.42, Math.max(width, height) * 0.75
  );
  glow.addColorStop(0, 'rgba(255,255,255,0.05)');
  glow.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  const cellW = width / params.cols;
  const cellH = height / params.rows;
  const skewTan = Math.tan((params.skew * Math.PI) / 180);
  const t = params.drift ? time * 0.25 : 0;

  for (const s of slabs) {
    const dn = params.drift
      ? noise.noise3D(s.u * 2.2, s.v * 2.2, t + s.phase) * params.driftAmount
      : 0;
    const x = (s.u + s.jx) * width + dn * cellW * 0.35;
    const y = (s.v + s.jy) * height + dn * cellH * 0.2;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(s.rot + dn * 0.15);
    ctx.transform(1, 0, skewTan, 1, 0, 0);

    const bw = s.w * cellW;
    const bh = s.h * cellH * 0.55;

    ctx.shadowColor = rgba(s.color, 0.55);
    ctx.shadowBlur = Math.min(cellW, cellH) * 0.35;

    if (s.fill) {
      ctx.fillStyle = rgba(s.color, 0.92);
      ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
      // inner highlight edge
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(-bw / 2, -bh / 2, bw, Math.max(1.5, bh * 0.08));
    } else {
      ctx.strokeStyle = rgba(s.color, 0.9);
      ctx.lineWidth = Math.max(1.5, bh * 0.16);
      ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
    }
    ctx.restore();
  }

  // vignette
  const vig = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.35,
    width / 2, height / 2, Math.max(width, height) * 0.78
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, width, height);
}

const sketch = createSketch({ canvas, render });

// ---------- controls ----------
const panel = createPanel('Tessellate');
panel.select('Palette', PALETTES.map((p) => p.name), params.palette.name, (name) => {
  params.palette = PALETTES.find((p) => p.name === name);
  generate();
});
panel.slider('Columns', { min: 3, max: 24, step: 1, value: params.cols }, (v) => { params.cols = v; generate(); });
panel.slider('Rows', { min: 3, max: 30, step: 1, value: params.rows }, (v) => { params.rows = v; generate(); });
panel.slider('Skew', { min: -60, max: 60, step: 1, value: params.skew }, (v) => { params.skew = v; });
panel.slider('Chaos', { min: 0, max: 1.5, step: 0.05, value: params.chaos }, (v) => { params.chaos = v; generate(); });
panel.slider('Fill mix', { min: 0, max: 1, step: 0.05, value: params.fillChance }, (v) => { params.fillChance = v; generate(); });
panel.toggle('Drift', params.drift, (v) => { params.drift = v; });
panel.buttons([
  ['Reseed', () => { params.seed = Math.floor(Math.random() * 100000); generate(); }],
  ['Export PNG', () => exportPNG(canvas, 'tessellate')],
]);
panel.note('Every composition is seeded — Reseed rolls a new one, sliders resculpt it live.');
