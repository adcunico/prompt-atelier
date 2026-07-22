// HALO — a seeded radial composition: slabs and arc strokes orbiting a
// centre, glowing on dark ink. Inspired by GMBermeo's starburst final
// project from the same Domestika course; our twist is a symmetry dial
// that morphs the piece from perfect kaleidoscope to full chaos.
import { createNoise } from './lib/noise.js';
import { PALETTES, rgba } from './lib/palettes.js';
import { createRandom, lerp } from './lib/random.js';
import { createPanel } from './lib/panel.js';
import { createSketch, exportPNG } from './lib/sketch.js';

const canvas = document.getElementById('canvas');
const noise = createNoise(17);

const params = {
  palette: PALETTES[1],
  seed: Math.floor(Math.random() * 100000),
  slices: 18,
  rings: 4,
  symmetry: 1.0,   // 1 = perfect mandala, 0 = every slice random
  drift: 0.02,
};

// one archetype slice (items) + per-slice jitter fields
let archetype = [];
let sliceJitter = [];

function generate() {
  const rand = createRandom(params.seed);
  archetype = [];
  for (let ring = 0; ring < params.rings; ring++) {
    const rT = (ring + 1) / params.rings;
    // a slab
    archetype.push({
      kind: 'slab',
      radius: rT * lerp(0.35, 1, rand.value()),
      w: rand.range(0.02, 0.16),
      h: rand.range(0.008, 0.05),
      color: rand.pick(params.palette.colors),
      fill: rand.chance(0.6),
    });
    // an arc
    archetype.push({
      kind: 'arc',
      radius: rT * lerp(0.3, 1.05, rand.value()),
      span: rand.range(0.2, 1.6),
      width: rand.range(0.004, 0.02),
      color: rand.pick(params.palette.colors),
      offset: rand.range(-0.5, 0.5),
    });
  }
  // per-slice variation used when symmetry < 1
  sliceJitter = [];
  for (let s = 0; s < 64; s++) {
    const jr = createRandom(params.seed + 31 * (s + 1));
    sliceJitter.push(archetype.map(() => ({
      dr: jr.range(-0.3, 0.3),
      ds: jr.range(0.4, 1.8),
      da: jr.range(-0.6, 0.6),
      color: jr.pick(params.palette.colors),
    })));
  }
}
generate();

function render(ctx, { width, height, time }) {
  const pal = params.palette;
  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, width, height);

  const cx = width / 2, cy = height / 2;
  const R = Math.min(width, height) * 0.42;
  const sliceAngle = (Math.PI * 2) / params.slices;
  const spin = time * params.drift * Math.PI * 2;

  // centre glow
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.5);
  glow.addColorStop(0, 'rgba(255,255,255,0.06)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  const breathe = 1 + noise.noise2D(0.3, time * 0.15) * 0.02;

  for (let s = 0; s < params.slices; s++) {
    const jit = sliceJitter[s % sliceJitter.length];
    const sym = params.symmetry;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spin + s * sliceAngle);

    for (let k = 0; k < archetype.length; k++) {
      const item = archetype[k];
      const j = jit[k];
      const radius = R * item.radius * (1 + j.dr * (1 - sym)) * breathe;
      const color = sym > 0.5 ? item.color : j.color;

      if (item.kind === 'slab') {
        const w = R * item.w * lerp(j.ds, 1, sym);
        const h = R * item.h * lerp(j.ds, 1, sym);
        ctx.save();
        ctx.translate(radius, 0);
        ctx.rotate(j.da * (1 - sym));
        ctx.shadowColor = rgba(color, 0.6);
        ctx.shadowBlur = R * 0.05;
        if (item.fill) {
          ctx.fillStyle = rgba(color, 0.9);
          ctx.fillRect(-w / 2, -h / 2, w, h);
        } else {
          ctx.strokeStyle = rgba(color, 0.85);
          ctx.lineWidth = Math.max(1, R * 0.004);
          ctx.strokeRect(-w / 2, -h / 2, w, h);
        }
        ctx.restore();
      } else {
        const span = sliceAngle * item.span * lerp(j.ds, 1, sym);
        const mid = item.offset * sliceAngle * (1 - sym * 0.5) + j.da * (1 - sym) * 0.5;
        ctx.strokeStyle = rgba(color, 0.75);
        ctx.lineWidth = Math.max(1, R * item.width);
        ctx.lineCap = 'round';
        ctx.shadowColor = rgba(color, 0.5);
        ctx.shadowBlur = R * 0.04;
        ctx.beginPath();
        ctx.arc(0, 0, radius, mid - span / 2, mid + span / 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // vignette
  const vig = ctx.createRadialGradient(cx, cy, R, cx, cy, Math.max(width, height) * 0.8);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, width, height);
}

createSketch({ canvas, render });

// ---------- controls ----------
const panel = createPanel('Halo');
panel.select('Palette', PALETTES.map((p) => p.name), params.palette.name, (name) => {
  params.palette = PALETTES.find((p) => p.name === name);
  generate();
});
panel.slider('Slices', { min: 4, max: 48, step: 1, value: params.slices }, (v) => { params.slices = v; });
panel.slider('Rings', { min: 1, max: 10, step: 1, value: params.rings }, (v) => { params.rings = v; generate(); });
panel.slider('Symmetry', { min: 0, max: 1, step: 0.05, value: params.symmetry }, (v) => { params.symmetry = v; });
panel.slider('Drift', { min: 0, max: 0.15, step: 0.005, value: params.drift }, (v) => { params.drift = v; });
panel.buttons([
  ['Reseed', () => { params.seed = Math.floor(Math.random() * 100000); generate(); }],
  ['Export PNG', () => exportPNG(canvas, 'halo')],
]);
panel.note('Symmetry at 1 is a perfect mandala; slide toward 0 and every slice goes its own way.');
