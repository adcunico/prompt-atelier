// MURMURATION — a starling flock of steering agents drawn as tapered
// streaks. Click to switch the pointer between predator and lure.
// Inspired by Bruno Imbrizi's boids experiments; ours braids the flock
// into palette-shimmering ribbons with a spatial hash under the hood.
import { PALETTES, samplePalette } from './lib/palettes.js';
import { createPanel } from './lib/panel.js';
import { createSketch, exportPNG } from './lib/sketch.js';
import { clamp } from './lib/random.js';

const canvas = document.getElementById('canvas');

const params = {
  palette: PALETTES[2],
  count: 900,
  cohesion: 1.0,
  wildness: 1.0,
  trails: true,
};

const PERCEPTION = 42;
const SEP_RADIUS = 16;

// interleaved: x, y, vx, vy, px, py
const STRIDE = 6;
let B = new Float32Array(0);
let count = 0;
let W = 1280, H = 720;

function build() {
  const old = B;
  const oldCount = count;
  count = params.count;
  B = new Float32Array(count * STRIDE);
  for (let i = 0; i < count; i++) {
    const o = i * STRIDE;
    if (i < oldCount) {
      B.set(old.subarray(i * STRIDE, i * STRIDE + STRIDE), o);
    } else {
      const a = Math.random() * Math.PI * 2;
      B[o] = Math.random() * W;
      B[o + 1] = Math.random() * H;
      B[o + 2] = Math.cos(a) * 120;
      B[o + 3] = Math.sin(a) * 120;
      B[o + 4] = B[o];
      B[o + 5] = B[o + 1];
    }
  }
}

const mouse = { x: -1e4, y: -1e4, predator: true, active: false };
canvas.addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; });
canvas.addEventListener('pointerleave', () => { mouse.active = false; });
canvas.addEventListener('pointerdown', () => {
  mouse.predator = !mouse.predator;
  updateModeNote();
});

// spatial hash, rebuilt each frame
const grid = new Map();
const cellOf = (x, y) => (((x / PERCEPTION) | 0) * 73856093) ^ (((y / PERCEPTION) | 0) * 19349663);

function render(ctx, state, dt) {
  W = state.width; H = state.height;
  const pal = params.palette;

  if (params.trails) {
    ctx.fillStyle = 'rgba(10, 12, 14, 0.16)';
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = pal.background;
    ctx.fillRect(0, 0, W, H);
  }

  grid.clear();
  for (let i = 0; i < count; i++) {
    const o = i * STRIDE;
    const key = cellOf(B[o], B[o + 1]);
    let cell = grid.get(key);
    if (!cell) grid.set(key, cell = []);
    cell.push(i);
  }

  const maxSpeed = 200 * params.wildness + 60;
  const minSpeed = 70;
  const per2 = PERCEPTION * PERCEPTION;
  const sep2 = SEP_RADIUS * SEP_RADIUS;

  ctx.lineCap = 'round';

  for (let i = 0; i < count; i++) {
    const o = i * STRIDE;
    const x = B[o], y = B[o + 1];
    let vx = B[o + 2], vy = B[o + 3];

    // gather neighbours from the 9 surrounding cells
    let nCount = 0, avx = 0, avy = 0, acx = 0, acy = 0, asx = 0, asy = 0;
    const cx = (x / PERCEPTION) | 0;
    const cy = (y / PERCEPTION) | 0;
    for (let gx = cx - 1; gx <= cx + 1; gx++) {
      for (let gy = cy - 1; gy <= cy + 1; gy++) {
        const cell = grid.get((gx * 73856093) ^ (gy * 19349663));
        if (!cell) continue;
        for (const j of cell) {
          if (j === i) continue;
          const jo = j * STRIDE;
          const dx = B[jo] - x;
          const dy = B[jo + 1] - y;
          const d2 = dx * dx + dy * dy;
          if (d2 > per2) continue;
          nCount++;
          avx += B[jo + 2]; avy += B[jo + 3];   // alignment
          acx += dx; acy += dy;                 // cohesion
          if (d2 < sep2 && d2 > 0.01) {         // separation
            const inv = 1 / Math.sqrt(d2);
            asx -= dx * inv; asy -= dy * inv;
          }
          if (nCount > 24) break; // enough neighbours; keeps it fast
        }
      }
    }

    if (nCount > 0) {
      const k = params.cohesion;
      vx += (avx / nCount - vx) * 0.9 * k * dt * 4;
      vy += (avy / nCount - vy) * 0.9 * k * dt * 4;
      vx += acx / nCount * 1.4 * k * dt * 4;
      vy += acy / nCount * 1.4 * k * dt * 4;
      vx += asx * 46 * dt * 4;
      vy += asy * 46 * dt * 4;
    }

    // pointer: predator scatters, lure orbits
    if (mouse.active) {
      const dx = x - mouse.x;
      const dy = y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (mouse.predator) {
        const R = 170;
        if (d2 < R * R && d2 > 1) {
          const d = Math.sqrt(d2);
          const f = (1 - d / R) * 2600 * dt;
          vx += (dx / d) * f;
          vy += (dy / d) * f;
        }
      } else {
        const R = 300;
        if (d2 < R * R && d2 > 1) {
          const d = Math.sqrt(d2);
          const pull = 640 * dt;
          vx -= (dx / d) * pull;
          vy -= (dy / d) * pull;
          // tangential swirl -> orbits instead of collapse
          vx += (-dy / d) * pull * 0.9;
          vy += (dx / d) * pull * 0.9;
        }
      }
    }

    // speed limits
    const sp = Math.hypot(vx, vy) || 1;
    const target = clamp(sp, minSpeed, maxSpeed);
    vx = (vx / sp) * target;
    vy = (vy / sp) * target;

    B[o + 4] = x; B[o + 5] = y;
    let nx = x + vx * dt;
    let ny = y + vy * dt;

    // wrap
    if (nx < -10) nx += W + 20; else if (nx > W + 10) nx -= W + 20;
    if (ny < -10) ny += H + 20; else if (ny > H + 10) ny -= H + 20;

    B[o] = nx; B[o + 1] = ny; B[o + 2] = vx; B[o + 3] = vy;

    // draw streak (skip wrap jumps)
    const jx = nx - B[o + 4];
    const jy = ny - B[o + 5];
    if (jx * jx + jy * jy < 2500) {
      const heading = Math.atan2(vy, vx) / (Math.PI * 2) + 0.5;
      const speedT = (target - minSpeed) / (maxSpeed - minSpeed);
      const [r, g, b] = samplePalette(pal, (heading * 0.7 + speedT * 0.3) % 1);
      ctx.strokeStyle = `rgba(${r},${g},${b},${0.45 + speedT * 0.5})`;
      ctx.lineWidth = 0.8 + speedT * 2.0;
      ctx.beginPath();
      ctx.moveTo(B[o + 4], B[o + 5]);
      ctx.lineTo(nx, ny);
      ctx.stroke();
    }
  }
}

createSketch({ canvas, render, onResize: () => build() });
build();

// ---------- controls ----------
const panel = createPanel('Murmuration');
let modeNote;
function updateModeNote() {
  modeNote.textContent = mouse.predator
    ? 'pointer: PREDATOR — the flock scatters. Click to become a lure.'
    : 'pointer: LURE — the flock orbits you. Click to become a predator.';
}
panel.select('Palette', PALETTES.map((p) => p.name), params.palette.name, (name) => {
  params.palette = PALETTES.find((p) => p.name === name);
});
panel.slider('Birds', { min: 100, max: 2500, step: 50, value: params.count }, (v) => { params.count = v; build(); });
panel.slider('Cohesion', { min: 0.1, max: 2.5, step: 0.05, value: params.cohesion }, (v) => { params.cohesion = v; });
panel.slider('Wildness', { min: 0.3, max: 2.5, step: 0.05, value: params.wildness }, (v) => { params.wildness = v; });
panel.toggle('Trails', params.trails, (v) => { params.trails = v; });
panel.button('Export PNG', () => exportPNG(canvas, 'murmuration'));
modeNote = panel.note('');
updateModeNote();
