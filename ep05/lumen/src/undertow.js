// UNDERTOW — a hidden simplex current steers long-lived particles that
// etch permanent ink trails, slowly building a dense engraving of the
// flow. Inspired by the flow-field work behind "Go With The Flow";
// ours can develop the etching through one of your photographs.
import { createNoise } from './lib/noise.js';
import { PALETTES, samplePalette } from './lib/palettes.js';
import { createPanel } from './lib/panel.js';
import { createSketch, exportPNG } from './lib/sketch.js';
import { IMAGES, loadImage, imageToData } from './lib/images.js';
import { clamp } from './lib/random.js';

const canvas = document.getElementById('canvas');

const params = {
  palette: PALETTES[0],
  fieldScale: 1.6,   // how tightly the current curls
  morph: 0.04,       // how fast the current itself drifts
  count: 1800,
  ink: 0.10,         // trail opacity
  tint: 'None',      // or an image name
};

let seed = 7;
let noiseGen = createNoise(seed);
let fieldZ = 0;

// interleaved: x, y, life
const STRIDE = 3;
let P = new Float32Array(0);
let W = 1280, H = 720;

const TINT_W = 160, TINT_H = 100;
let tintData = null; // Uint8ClampedArray or null

async function loadTint() {
  if (params.tint === 'None') { tintData = null; return; }
  const entry = IMAGES.find((i) => i.name === params.tint);
  const img = await loadImage(entry.src);
  tintData = imageToData(img, TINT_W, TINT_H).data;
}

function spawn(o) {
  P[o] = Math.random() * W;
  P[o + 1] = Math.random() * H;
  P[o + 2] = 4 + Math.random() * 10; // seconds of life
}

function build() {
  P = new Float32Array(params.count * STRIDE);
  for (let i = 0; i < params.count; i++) spawn(i * STRIDE);
}

let needsClear = true;

function clearInk(ctx) {
  ctx.fillStyle = params.palette.background;
  ctx.fillRect(0, 0, W, H);
}

function reseed() {
  seed = (Math.random() * 100000) | 0;
  noiseGen = createNoise(seed);
  fieldZ = 0;
  needsClear = true;
  build();
}

function render(ctx, state, dt) {
  W = state.width; H = state.height;
  if (needsClear) { clearInk(ctx); needsClear = false; }

  fieldZ += params.morph * dt;
  const s = params.fieldScale / 700;
  const speed = 60;
  const pal = params.palette;

  ctx.lineCap = 'round';
  ctx.lineWidth = 1;

  for (let i = 0; i < params.count; i++) {
    const o = i * STRIDE;
    let x = P[o], y = P[o + 1];

    const n = noiseGen.noise3D(x * s, y * s, fieldZ);
    const a = n * Math.PI * 2.4;
    const nx = x + Math.cos(a) * speed * dt;
    const ny = y + Math.sin(a) * speed * dt;

    P[o + 2] -= dt;
    if (nx < 0 || nx > W || ny < 0 || ny > H || P[o + 2] <= 0) {
      spawn(o);
      continue;
    }

    let r, g, b, alpha = params.ink;
    if (tintData) {
      const ti = ((clamp(ny / H, 0, 0.999) * TINT_H) | 0) * TINT_W + ((clamp(nx / W, 0, 0.999) * TINT_W) | 0);
      r = tintData[ti * 4]; g = tintData[ti * 4 + 1]; b = tintData[ti * 4 + 2];
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      alpha = params.ink * (0.25 + lum * 1.3); // bright areas of the photo develop faster
    } else {
      [r, g, b] = samplePalette(pal, (n * 0.5 + 0.5));
    }

    ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(nx, ny);
    ctx.stroke();

    P[o] = nx; P[o + 1] = ny;
  }
}

createSketch({
  canvas,
  render,
  onResize: () => { needsClear = true; build(); loadTint(); },
});
build();

// ---------- controls ----------
const panel = createPanel('Undertow');
panel.select('Palette', PALETTES.map((p) => p.name), params.palette.name, (name) => {
  params.palette = PALETTES.find((p) => p.name === name);
  needsClear = true;
});
panel.select('Develop', ['None', ...IMAGES.map((i) => i.name)], params.tint, async (name) => {
  params.tint = name;
  await loadTint();
  needsClear = true;
});
panel.slider('Currents', { min: 0.4, max: 5, step: 0.1, value: params.fieldScale }, (v) => { params.fieldScale = v; });
panel.slider('Morph', { min: 0, max: 0.3, step: 0.005, value: params.morph }, (v) => { params.morph = v; });
panel.slider('Particles', { min: 300, max: 5000, step: 100, value: params.count }, (v) => { params.count = v; build(); });
panel.slider('Ink', { min: 0.02, max: 0.35, step: 0.01, value: params.ink }, (v) => { params.ink = v; });
panel.buttons([
  ['New current', reseed],
  ['Wash', () => { needsClear = true; }],
]);
panel.button('Export PNG', () => exportPNG(canvas, 'undertow'));
panel.note('The etching accumulates over time — let it sit. "Develop" reveals one of your photographs through the currents.');
