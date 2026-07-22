// EMBER — a photograph dissolved into particles. Each particle keeps the
// colour of its home pixel, springs back to it, flees the pointer, and can
// be shattered and reborn. Descended from the course "particles" sketch,
// which was monochrome — here the image itself is the palette.
import { createPanel } from './lib/panel.js';
import { createSketch, exportPNG } from './lib/sketch.js';
import { IMAGES, loadImage, imageToData } from './lib/images.js';

const canvas = document.getElementById('canvas');

const params = {
  imageIndex: 1,
  step: 5,          // px between sampled particles (lower = more particles)
  repelRadius: 110,
  repelForce: 1400,
  stiffness: 22,
  damping: 4.2,
  trails: true,
  glow: true,
};

let img = null;
let P = null;       // interleaved particle data
let count = 0;
const STRIDE = 9;   // x, y, vx, vy, hx, hy, r, g, b
let sketchState = null;

async function loadCurrentImage() {
  img = await loadImage(IMAGES[params.imageIndex].src);
  if (sketchState) buildParticles(sketchState);
}

function buildParticles({ width, height }) {
  if (!img || !width || !height) return;
  const margin = Math.min(width, height) * 0.06;
  const w = Math.floor(width - margin * 2);
  const h = Math.floor(height - margin * 2);
  const data = imageToData(img, w, h).data;

  const step = params.step;
  const cols = Math.floor(w / step);
  const rows = Math.floor(h / step);
  const list = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const px = Math.floor(i * step + step / 2);
      const py = Math.floor(j * step + step / 2);
      const k = (py * w + px) * 4;
      const r = data[k], g = data[k + 1], b = data[k + 2];
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      if (lum < 0.045) continue; // skip near-black pixels
      list.push(margin + px, margin + py, 0, 0, margin + px, margin + py, r, g, b);
    }
  }
  P = new Float32Array(list);
  count = P.length / STRIDE;
}

const mouse = { x: -1e4, y: -1e4, down: false };
canvas.addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
canvas.addEventListener('pointerdown', (e) => { mouse.down = true; mouse.x = e.clientX; mouse.y = e.clientY; });
window.addEventListener('pointerup', () => { mouse.down = false; });
canvas.addEventListener('pointerleave', () => { mouse.x = -1e4; mouse.y = -1e4; });

function shatter() {
  if (!P) return;
  const cx = sketchState.width / 2;
  const cy = sketchState.height / 2;
  for (let i = 0; i < count; i++) {
    const o = i * STRIDE;
    const dx = P[o] - cx;
    const dy = P[o + 1] - cy;
    const d = Math.hypot(dx, dy) || 1;
    const kick = 600 + Math.random() * 900;
    P[o + 2] += (dx / d) * kick + (Math.random() - 0.5) * 500;
    P[o + 3] += (dy / d) * kick + (Math.random() - 0.5) * 500;
  }
}

function render(ctx, state, dt) {
  const { width, height } = state;

  if (params.trails) {
    ctx.fillStyle = 'rgba(8, 8, 12, 0.28)';
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.fillStyle = '#08080c';
    ctx.fillRect(0, 0, width, height);
  }

  if (!P) return;

  const rr = params.repelRadius;
  const rr2 = rr * rr;
  const force = mouse.down ? params.repelForce * 2.2 : params.repelForce;
  const k = params.stiffness;
  const damp = Math.max(0, 1 - params.damping * dt);

  ctx.globalCompositeOperation = params.glow ? 'lighter' : 'source-over';

  for (let i = 0; i < count; i++) {
    const o = i * STRIDE;
    let x = P[o], y = P[o + 1], vx = P[o + 2], vy = P[o + 3];

    // spring home
    vx += (P[o + 4] - x) * k * dt;
    vy += (P[o + 5] - y) * k * dt;

    // pointer repulsion
    const dx = x - mouse.x;
    const dy = y - mouse.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < rr2 && d2 > 0.01) {
      const d = Math.sqrt(d2);
      const f = (1 - d / rr) * force * dt;
      vx += (dx / d) * f;
      vy += (dy / d) * f;
    }

    vx *= damp;
    vy *= damp;
    x += vx * dt;
    y += vy * dt;

    P[o] = x; P[o + 1] = y; P[o + 2] = vx; P[o + 3] = vy;

    // displaced particles burn hotter
    const speed = Math.min(1, (vx * vx + vy * vy) / 90000);
    const r = P[o + 6] + (255 - P[o + 6]) * speed * 0.7;
    const g = P[o + 7] + (180 - P[o + 7]) * speed * 0.4;
    const b = P[o + 8];
    ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
    const size = 1.4 + speed * 1.6;
    ctx.fillRect(x, y, size, size);
  }

  ctx.globalCompositeOperation = 'source-over';
}

const sketch = createSketch({
  canvas,
  render,
  onResize: (state) => { sketchState = state; buildParticles(state); },
});
sketchState = sketch.state;
loadCurrentImage();

// ---------- controls ----------
const panel = createPanel('Ember');
panel.select('Image', IMAGES.map((i) => i.name), IMAGES[params.imageIndex].name, (name) => {
  params.imageIndex = IMAGES.findIndex((i) => i.name === name);
  loadCurrentImage();
});
panel.slider('Density', { min: 2, max: 12, step: 1, value: params.step }, (v) => {
  params.step = v;
  buildParticles(sketchState);
});
panel.slider('Repel size', { min: 30, max: 320, step: 5, value: params.repelRadius }, (v) => { params.repelRadius = v; });
panel.slider('Repel force', { min: 200, max: 4000, step: 50, value: params.repelForce }, (v) => { params.repelForce = v; });
panel.slider('Spring', { min: 4, max: 80, step: 1, value: params.stiffness }, (v) => { params.stiffness = v; });
panel.toggle('Trails', params.trails, (v) => { params.trails = v; });
panel.toggle('Glow', params.glow, (v) => { params.glow = v; });
panel.button('Shatter', shatter, { primary: true });
panel.button('Export PNG', () => exportPNG(canvas, 'ember'));
panel.note('Brush through the image with your pointer — hold click to push harder. Shatter blows it apart; the springs pull it home.');
