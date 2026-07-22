// SILK — a woven surface of flowing curves whose terrain is carved by a
// photograph's luminance, stirred by simplex wind, rippled by the mouse.
// Descended from the course "curves" sketch; the image is the landscape.
import { createNoise } from './lib/noise.js';
import { PALETTES, samplePalette } from './lib/palettes.js';
import { createPanel } from './lib/panel.js';
import { createSketch, exportPNG } from './lib/sketch.js';
import { IMAGES, loadImage, imageToData } from './lib/images.js';
import { clamp, lerp } from './lib/random.js';

const canvas = document.getElementById('canvas');
const noise = createNoise(23);

const GRID_W = 120; // luminance field resolution
const GRID_H = 80;

const params = {
  palette: PALETTES[5],
  imageIndex: 0,
  lines: 60,
  amplitude: 1.0,
  flow: 0.35,
  imageWeight: 0.75,
  lineWidth: 1.6,
};

let lum = null; // Float32Array GRID_W * GRID_H, 0..1

async function loadLuminance() {
  const img = await loadImage(IMAGES[params.imageIndex].src);
  const data = imageToData(img, GRID_W, GRID_H).data;
  lum = new Float32Array(GRID_W * GRID_H);
  for (let i = 0; i < GRID_W * GRID_H; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    lum[i] = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }
}
loadLuminance();

function sampleLum(u, v) {
  if (!lum) return 0.5;
  const x = clamp(u, 0, 0.999) * (GRID_W - 1);
  const y = clamp(v, 0, 0.999) * (GRID_H - 1);
  const xi = Math.floor(x), yi = Math.floor(y);
  const fx = x - xi, fy = y - yi;
  const idx = (xx, yy) => lum[Math.min(yy, GRID_H - 1) * GRID_W + Math.min(xx, GRID_W - 1)];
  const top = lerp(idx(xi, yi), idx(xi + 1, yi), fx);
  const bot = lerp(idx(xi, yi + 1), idx(xi + 1, yi + 1), fx);
  return lerp(top, bot, fy);
}

// mouse ripple — springy displacement field centred on the pointer
const mouse = { x: -1e4, y: -1e4, energy: 0 };
canvas.addEventListener('pointermove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.energy = Math.min(1, mouse.energy + 0.08);
});
canvas.addEventListener('pointerleave', () => { mouse.x = -1e4; mouse.y = -1e4; });

function render(ctx, { width, height, time }) {
  const pal = params.palette;
  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, width, height);

  mouse.energy *= 0.96;

  const margin = height * 0.08;
  const usableH = height - margin * 2;
  const cols = 140;
  const t = time * params.flow;
  const ampPx = (usableH / params.lines) * 3.2 * params.amplitude;
  const rippleR = Math.min(width, height) * 0.22;

  ctx.lineCap = 'round';

  for (let j = 0; j < params.lines; j++) {
    const v = j / (params.lines - 1);
    const baseY = margin + v * usableH;

    // build the displaced polyline
    const pts = [];
    for (let i = 0; i <= cols; i++) {
      const u = i / cols;
      const x = u * width;
      const bright = sampleLum(u, v);
      const wind = noise.noise3D(u * 2.6, v * 3.0, t);
      let y = baseY
        - bright * ampPx * params.imageWeight
        + wind * ampPx * 0.55 * (1 - params.imageWeight * 0.5);

      // mouse ripple
      const dx = x - mouse.x;
      const dy = baseY - mouse.y;
      const d = Math.hypot(dx, dy);
      if (d < rippleR) {
        const fall = (1 - d / rippleR) ** 2;
        y -= Math.sin(d * 0.045 - time * 6) * fall * 26 * mouse.energy;
      }
      pts.push([x, y, bright]);
    }

    // draw with quadratic smoothing, colour from luminance + depth
    for (let i = 1; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1, b1] = pts[i];
      const midX0 = (x0 + x1) / 2;
      const [x2, y2] = pts[i + 1];
      const midX1 = (x1 + x2) / 2;
      const [r, g, b] = samplePalette(pal, b1 * 0.85 + v * 0.15);
      ctx.strokeStyle = `rgba(${r},${g},${b},${0.35 + b1 * 0.6})`;
      ctx.lineWidth = params.lineWidth * (0.5 + b1 * 1.4);
      ctx.beginPath();
      ctx.moveTo(midX0, (y0 + y1) / 2);
      ctx.quadraticCurveTo(x1, y1, midX1, (y1 + y2) / 2);
      ctx.stroke();
    }
  }

  // vignette
  const vig = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.4,
    width / 2, height / 2, Math.max(width, height) * 0.8
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, width, height);
}

createSketch({ canvas, render });

// ---------- controls ----------
const panel = createPanel('Silk');
panel.select('Image', IMAGES.map((i) => i.name), IMAGES[params.imageIndex].name, (name) => {
  params.imageIndex = IMAGES.findIndex((i) => i.name === name);
  loadLuminance();
});
panel.select('Palette', PALETTES.map((p) => p.name), params.palette.name, (name) => {
  params.palette = PALETTES.find((p) => p.name === name);
});
panel.slider('Lines', { min: 20, max: 140, step: 2, value: params.lines }, (v) => { params.lines = v; });
panel.slider('Amplitude', { min: 0.2, max: 2.5, step: 0.05, value: params.amplitude }, (v) => { params.amplitude = v; });
panel.slider('Flow', { min: 0, max: 1.2, step: 0.05, value: params.flow }, (v) => { params.flow = v; });
panel.slider('Image', { min: 0, max: 1, step: 0.05, value: params.imageWeight }, (v) => { params.imageWeight = v; });
panel.slider('Weight', { min: 0.5, max: 4, step: 0.1, value: params.lineWidth }, (v) => { params.lineWidth = v; });
panel.button('Export PNG', () => exportPNG(canvas, 'silk'));
panel.note('The curves trace the brightness of the chosen photograph. Move the mouse to stir the surface.');
