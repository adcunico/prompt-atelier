// WEAVE — the classic noise-grid study: a lattice of strokes, each
// rotated and sized by a drifting simplex field. Inspired by the course
// noise-grid sketch in GMBermeo's repo; our twist is that the field is
// combable — the pointer parts the strokes like fur, and colour rides
// the same noise that turns them.
import { createNoise } from './lib/noise.js';
import { PALETTES, samplePalette } from './lib/palettes.js';
import { createPanel } from './lib/panel.js';
import { createSketch, exportPNG } from './lib/sketch.js';
import { lerp, smoothstep } from './lib/random.js';

const canvas = document.getElementById('canvas');
const noise = createNoise(29);

const params = {
  palette: PALETTES[4],
  cols: 44,
  freq: 0.9,
  amp: 0.8,
  speed: 0.25,
  comb: 1.0,
};

const mouse = { x: -1e4, y: -1e4 };
canvas.addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
canvas.addEventListener('pointerleave', () => { mouse.x = -1e4; mouse.y = -1e4; });

function render(ctx, { width, height, time }) {
  const pal = params.palette;
  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, width, height);

  const cols = params.cols;
  const cell = width / cols;
  const rows = Math.ceil(height / cell) + 1;
  const t = time * params.speed;
  const combR = Math.min(width, height) * 0.24;
  ctx.lineCap = 'round';

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols + 1; i++) {
      const x = i * cell + cell / 2;
      const y = j * cell + cell / 2;
      const n = noise.noise3D(i * params.freq * 0.1, j * params.freq * 0.1, t);

      let angle = n * Math.PI * params.amp;
      let boost = 0;

      // comb: strokes part away from the pointer
      const dx = x - mouse.x;
      const dy = y - mouse.y;
      const d = Math.hypot(dx, dy);
      if (d < combR) {
        const f = smoothstep(1 - d / combR) * params.comb;
        angle = lerp(angle, Math.atan2(dy, dx), f);
        boost = f;
      }

      const len = cell * (0.45 + Math.abs(n) * 0.5 + boost * 0.35);
      const w = Math.max(1, cell * (0.06 + Math.abs(n) * 0.16 + boost * 0.1));
      const [r, g, b] = samplePalette(pal, n * 0.5 + 0.5);

      ctx.strokeStyle = `rgba(${r},${g},${b},${0.55 + Math.abs(n) * 0.35 + boost * 0.2})`;
      ctx.lineWidth = w;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(-len / 2, 0);
      ctx.lineTo(len / 2, 0);
      ctx.stroke();
      ctx.restore();
    }
  }

  // vignette
  const vig = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.45,
    width / 2, height / 2, Math.max(width, height) * 0.8
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, width, height);
}

createSketch({ canvas, render });

// ---------- controls ----------
const panel = createPanel('Weave');
panel.select('Palette', PALETTES.map((p) => p.name), params.palette.name, (name) => {
  params.palette = PALETTES.find((p) => p.name === name);
});
panel.slider('Density', { min: 12, max: 90, step: 2, value: params.cols }, (v) => { params.cols = v; });
panel.slider('Frequency', { min: 0.2, max: 3, step: 0.05, value: params.freq }, (v) => { params.freq = v; });
panel.slider('Turn', { min: 0.1, max: 2.5, step: 0.05, value: params.amp }, (v) => { params.amp = v; });
panel.slider('Drift', { min: 0, max: 1, step: 0.05, value: params.speed }, (v) => { params.speed = v; });
panel.slider('Comb', { min: 0, max: 2, step: 0.05, value: params.comb }, (v) => { params.comb = v; });
panel.button('Export PNG', () => exportPNG(canvas, 'weave'));
panel.note('Run the pointer through the lattice — the strokes part like combed fur, then the field reclaims them.');
