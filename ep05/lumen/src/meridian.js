// MERIDIAN — a sphere of thousands of points, rotated and perspective-
// projected by hand onto the 2D canvas. Drag to spin it with inertia;
// noise storms ripple its surface; with music on it breathes on the bass.
// Inspired by Bruno Imbrizi's toxiclibs sphere-mesh experiments — done
// here with no 3D library at all.
import { createNoise } from './lib/noise.js';
import { PALETTES, samplePalette } from './lib/palettes.js';
import { createPanel } from './lib/panel.js';
import { createSketch, exportPNG } from './lib/sketch.js';
import { createTrackDrive } from './lib/audio.js';
import { clamp } from './lib/random.js';

const canvas = document.getElementById('canvas');
const noise = createNoise(53);
const music = createTrackDrive();

const params = {
  palette: PALETTES[5],
  points: 2600,
  storm: 0.45,
  spin: 0.12,
  spiral: true,
};

// unit sphere points via fibonacci lattice
let base = new Float32Array(0);
function build() {
  const n = params.points;
  base = new Float32Array(n * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const theta = golden * i;
    base[i * 3] = Math.cos(theta) * rad;
    base[i * 3 + 1] = y;
    base[i * 3 + 2] = Math.sin(theta) * rad;
  }
  proj = new Float32Array(n * 4); // sx, sy, depthT, nT
}
let proj = new Float32Array(0);

// drag rotation with inertia
const rot = { yaw: 0.6, pitch: 0.35, vyaw: 0, vpitch: 0, dragging: false, lx: 0, ly: 0 };
canvas.addEventListener('pointerdown', (e) => {
  rot.dragging = true; rot.lx = e.clientX; rot.ly = e.clientY;
});
window.addEventListener('pointerup', () => { rot.dragging = false; });
window.addEventListener('pointermove', (e) => {
  if (!rot.dragging) return;
  const dx = e.clientX - rot.lx;
  const dy = e.clientY - rot.ly;
  rot.lx = e.clientX; rot.ly = e.clientY;
  rot.vyaw = dx * 0.16;
  rot.vpitch = dy * 0.16;
});

function render(ctx, state, dt) {
  const { width: W, height: H, time } = state;
  const pal = params.palette;

  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, W, H);

  music.update();

  // integrate rotation: drag velocity + idle spin, with inertia decay
  if (!rot.dragging) {
    rot.vyaw *= 0.95;
    rot.vpitch *= 0.95;
    rot.vyaw += params.spin * dt * 2;
  }
  rot.yaw += rot.vyaw * dt * 2.4;
  rot.pitch = clamp(rot.pitch + rot.vpitch * dt * 2.4, -1.4, 1.4);

  const R = Math.min(W, H) * 0.32 * (1 + music.bass * 0.22);
  const cx = W / 2, cy = H / 2;
  const fov = R * 3.2;
  const cosY = Math.cos(rot.yaw), sinY = Math.sin(rot.yaw);
  const cosP = Math.cos(rot.pitch), sinP = Math.sin(rot.pitch);
  const t = time * 0.35;
  const n = base.length / 3;

  // halo
  const halo = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 2.1);
  halo.addColorStop(0, `rgba(255,255,255,${0.04 + music.level * 0.05})`);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < n; i++) {
    let x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2];

    const nv = noise.noise3D(x * 1.5 + t, y * 1.5, z * 1.5);
    const r = R * (1 + nv * params.storm * 0.35);

    // yaw (around Y), then pitch (around X)
    const x1 = x * cosY + z * sinY;
    const z1 = -x * sinY + z * cosY;
    const y1 = y * cosP - z1 * sinP;
    const z2 = y * sinP + z1 * cosP;

    const scale = fov / (fov - z2 * r);
    proj[i * 4] = cx + x1 * r * scale;
    proj[i * 4 + 1] = cy + y1 * r * scale;
    proj[i * 4 + 2] = (z2 + 1) / 2;        // 0 back .. 1 front
    proj[i * 4 + 3] = nv * 0.5 + 0.5;
  }

  ctx.globalCompositeOperation = 'lighter';

  // spiral thread through the lattice order
  if (params.spiral) {
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const sx = proj[i * 4], sy = proj[i * 4 + 1];
      i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
    }
    const [sr, sg, sb] = samplePalette(pal, 0.5);
    ctx.strokeStyle = `rgba(${sr},${sg},${sb},0.10)`;
    ctx.stroke();
  }

  // points, back-to-front brightness
  for (let i = 0; i < n; i++) {
    const depth = proj[i * 4 + 2];
    const [r, g, b] = samplePalette(pal, proj[i * 4 + 3] * 0.65 + depth * 0.3);
    ctx.fillStyle = `rgba(${r},${g},${b},${0.15 + depth * 0.75})`;
    const size = 0.6 + depth * 2.2 + music.bass * depth * 1.5;
    ctx.fillRect(proj[i * 4] - size / 2, proj[i * 4 + 1] - size / 2, size, size);
  }

  ctx.globalCompositeOperation = 'source-over';
}

createSketch({ canvas, render });
build();

// ---------- controls ----------
const panel = createPanel('Meridian');
panel.select('Palette', PALETTES.map((p) => p.name), params.palette.name, (name) => {
  params.palette = PALETTES.find((p) => p.name === name);
});
panel.slider('Points', { min: 500, max: 6000, step: 100, value: params.points }, (v) => { params.points = v; build(); });
panel.slider('Storm', { min: 0, max: 1.5, step: 0.05, value: params.storm }, (v) => { params.storm = v; });
panel.slider('Spin', { min: 0, max: 0.5, step: 0.01, value: params.spin }, (v) => { params.spin = v; });
panel.toggle('Spiral', params.spiral, (v) => { params.spiral = v; });
const musicBtn = panel.button('Music drive: off', async () => {
  await music.toggle();
  musicBtn.textContent = music.playing ? 'Music drive: on' : 'Music drive: off';
});
panel.button('Export PNG', () => exportPNG(canvas, 'meridian'));
panel.note('Drag to spin the sphere — it keeps your momentum. Storm ripples the surface; with music on it breathes on the bass.');
