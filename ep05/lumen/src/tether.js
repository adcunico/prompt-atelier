// TETHER — a drifting constellation: agents connected by luminous
// threads whenever they wander near each other. Inspired by GMBermeo's
// agents final project (where movement was left commented out) — our
// twist is to switch the motion on and hand you gravity: the pointer
// gathers the constellation, clicking flips it to push.
import { PALETTES, samplePalette, rgba } from './lib/palettes.js';
import { createPanel } from './lib/panel.js';
import { createSketch, exportPNG } from './lib/sketch.js';
import { clamp } from './lib/random.js';

const canvas = document.getElementById('canvas');

const params = {
  palette: PALETTES[5],
  count: 90,
  linkDist: 180,
  speed: 1.0,
  gravity: 1.0,
};

let agents = [];
let W = 1280, H = 720;

function build() {
  const old = agents;
  agents = [];
  for (let i = 0; i < params.count; i++) {
    if (i < old.length) { agents.push(old[i]); continue; }
    const a = Math.random() * Math.PI * 2;
    const sp = 18 + Math.random() * 40;
    agents.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      r: 1.5 + Math.random() * 3.5,
      phase: Math.random() * Math.PI * 2,
    });
  }
}

const mouse = { x: -1e4, y: -1e4, attract: true, active: false };
canvas.addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; });
canvas.addEventListener('pointerleave', () => { mouse.active = false; });
canvas.addEventListener('pointerdown', () => { mouse.attract = !mouse.attract; updateModeNote(); });

function render(ctx, state, dt) {
  W = state.width; H = state.height;
  const pal = params.palette;

  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, W, H);

  const link = params.linkDist;
  const link2 = link * link;

  // move
  for (const a of agents) {
    if (mouse.active) {
      const dx = mouse.x - a.x;
      const dy = mouse.y - a.y;
      const d2 = dx * dx + dy * dy;
      const R = 340;
      if (d2 < R * R && d2 > 4) {
        const d = Math.sqrt(d2);
        const dir = mouse.attract ? 1 : -1.6;
        const f = (1 - d / R) * 160 * params.gravity * dir * dt;
        a.vx += (dx / d) * f;
        a.vy += (dy / d) * f;
      }
    }
    // gentle speed cap so gravity can't sling agents off
    const sp = Math.hypot(a.vx, a.vy);
    const cap = 140 * params.speed;
    if (sp > cap) { a.vx = (a.vx / sp) * cap; a.vy = (a.vy / sp) * cap; }

    a.x += a.vx * params.speed * dt;
    a.y += a.vy * params.speed * dt;
    if (a.x < a.r) { a.x = a.r; a.vx = Math.abs(a.vx); }
    if (a.x > W - a.r) { a.x = W - a.r; a.vx = -Math.abs(a.vx); }
    if (a.y < a.r) { a.y = a.r; a.vy = Math.abs(a.vy); }
    if (a.y > H - a.r) { a.y = H - a.r; a.vy = -Math.abs(a.vy); }
  }

  // threads
  ctx.lineCap = 'round';
  for (let i = 0; i < agents.length; i++) {
    for (let j = i + 1; j < agents.length; j++) {
      const A = agents[i], B = agents[j];
      const dx = B.x - A.x, dy = B.y - A.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > link2) continue;
      const t = 1 - Math.sqrt(d2) / link; // 1 close .. 0 far
      const [r, g, b] = samplePalette(pal, 0.15 + t * 0.7);
      ctx.strokeStyle = `rgba(${r},${g},${b},${0.05 + t * 0.55})`;
      ctx.lineWidth = 0.4 + t * 2.2;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.stroke();
    }
  }

  // stars
  ctx.globalCompositeOperation = 'lighter';
  for (const a of agents) {
    const tw = 0.65 + Math.sin(state.time * 2.2 + a.phase) * 0.35;
    const [r, g, b] = samplePalette(pal, clamp(a.r / 5, 0, 1));
    ctx.fillStyle = `rgba(${r},${g},${b},${tw})`;
    ctx.shadowColor = rgba(pal.colors[0], tw * 0.8);
    ctx.shadowBlur = a.r * 5;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r * (0.85 + tw * 0.3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'source-over';
}

createSketch({ canvas, render, onResize: (s) => { W = s.width; H = s.height; build(); } });
build();

// ---------- controls ----------
const panel = createPanel('Tether');
let modeNote;
function updateModeNote() {
  modeNote.textContent = mouse.attract
    ? 'pointer: GATHER — the constellation drifts toward you. Click to push instead.'
    : 'pointer: PUSH — you scatter the constellation. Click to gather instead.';
}
panel.select('Palette', PALETTES.map((p) => p.name), params.palette.name, (name) => {
  params.palette = PALETTES.find((p) => p.name === name);
});
panel.slider('Agents', { min: 20, max: 240, step: 5, value: params.count }, (v) => { params.count = v; build(); });
panel.slider('Reach', { min: 60, max: 420, step: 10, value: params.linkDist }, (v) => { params.linkDist = v; });
panel.slider('Speed', { min: 0.2, max: 3, step: 0.05, value: params.speed }, (v) => { params.speed = v; });
panel.slider('Gravity', { min: 0, max: 3, step: 0.05, value: params.gravity }, (v) => { params.gravity = v; });
panel.button('Export PNG', () => exportPNG(canvas, 'tether'));
modeNote = panel.note('');
updateModeNote();
