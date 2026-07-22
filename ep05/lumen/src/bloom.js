// BLOOM — click to plant a seed; recursive branches grow in real time,
// curving through noise, thinning as they split, ending in glowing
// blossoms. Inspired by the branching structures in Bruno Imbrizi's
// experiment 07; ours grows a whole garden and pulses with your music.
import { createNoise } from './lib/noise.js';
import { PALETTES, samplePalette, rgba } from './lib/palettes.js';
import { createPanel } from './lib/panel.js';
import { createSketch, exportPNG } from './lib/sketch.js';
import { createRandom } from './lib/random.js';
import { createTrackDrive } from './lib/audio.js';

const canvas = document.getElementById('canvas');
const noise = createNoise(41);
const music = createTrackDrive();

const params = {
  palette: PALETTES[3],
  spread: 0.55,     // branching angle
  speed: 90,        // growth px/s
  twist: 1.0,       // noise curvature
};

const MAX_DEPTH = 8;
const MAX_TIPS = 2600;

let tips = [];          // living growth tips
let planted = [];       // [{x, y, seed}] for Regrow
let needsClear = true;
let W = 1280, H = 720;

function plant(x, y, seed = (Math.random() * 100000) | 0, remember = true) {
  if (remember) planted.push({ x, y, seed });
  const rand = createRandom(seed);
  const size = Math.min(W, H);
  tips.push({
    x, y,
    angle: -Math.PI / 2 + rand.range(-0.15, 0.15),
    len: 0,
    maxLen: size * rand.range(0.16, 0.24),
    th: size * 0.012,
    depth: 0,
    rand,
    phase: rand.value() * 100,
  });
}

function regrow() {
  tips = [];
  needsClear = true;
  for (const p of planted) plant(p.x, p.y, p.seed, false);
}

function clearGarden() {
  tips = [];
  planted = [];
  needsClear = true;
}

canvas.addEventListener('pointerdown', (e) => plant(e.clientX, e.clientY));

function blossom(ctx, tip, pal) {
  const size = tip.th * 6 + 3 + music.bass * 10;
  const [r, g, b] = samplePalette(pal, 0.85 + tip.rand.value() * 0.15 - 0.075);
  const grad = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, size);
  grad.addColorStop(0, `rgba(${r},${g},${b},0.9)`);
  grad.addColorStop(0.4, `rgba(${r},${g},${b},0.35)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(tip.x, tip.y, size, 0, Math.PI * 2);
  ctx.fill();
}

function render(ctx, state, dt) {
  W = state.width; H = state.height;
  const pal = params.palette;

  if (needsClear) {
    ctx.fillStyle = pal.background;
    ctx.fillRect(0, 0, W, H);
    // faint ground light
    const g = ctx.createLinearGradient(0, H * 0.55, 0, H);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(255,255,255,0.045)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    needsClear = false;
  }

  music.update();
  const growMul = 1 + music.level * 2.2;

  ctx.lineCap = 'round';
  const born = [];

  for (const tip of tips) {
    if (tip.dead) continue;
    const step = params.speed * growMul * dt * (1 - tip.depth / (MAX_DEPTH + 3));
    const wob = noise.noise3D(tip.x * 0.004, tip.y * 0.004, tip.phase + state.time * 0.15);
    tip.angle += wob * params.twist * 1.6 * dt;

    const nx = tip.x + Math.cos(tip.angle) * step;
    const ny = tip.y + Math.sin(tip.angle) * step;

    const t = tip.depth / MAX_DEPTH;
    const [r, g, b] = samplePalette(pal, t * 0.75);
    const taper = 1 - (tip.len / tip.maxLen) * 0.4;
    ctx.strokeStyle = `rgba(${r},${g},${b},${0.55 + t * 0.35})`;
    ctx.lineWidth = Math.max(0.5, tip.th * taper);
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(nx, ny);
    ctx.stroke();

    tip.x = nx; tip.y = ny;
    tip.len += step;

    if (tip.len >= tip.maxLen) {
      tip.dead = true;
      if (tip.depth >= MAX_DEPTH || tip.th < 0.4) {
        blossom(ctx, tip, pal);
      } else {
        const rand = tip.rand;
        const kids = rand.chance(0.18) ? 3 : 2;
        for (let k = 0; k < kids; k++) {
          if (tips.length + born.length >= MAX_TIPS) break;
          const dir = (k / (kids - 1) - 0.5) * 2; // -1 .. 1
          born.push({
            x: tip.x, y: tip.y,
            angle: tip.angle + dir * params.spread * rand.range(0.6, 1.3),
            len: 0,
            maxLen: tip.maxLen * rand.range(0.62, 0.8),
            th: tip.th * 0.68,
            depth: tip.depth + 1,
            rand,
            phase: tip.phase + k,
          });
        }
        if (rand.chance(0.25)) blossom(ctx, { ...tip, th: tip.th * 0.5 }, pal);
      }
    }
  }

  tips = tips.filter((t) => !t.dead);
  tips.push(...born);
}

createSketch({ canvas, render, onResize: () => { needsClear = true; regrow(); } });

// plant an opening tree so the page isn't empty
setTimeout(() => {
  if (planted.length === 0) plant(window.innerWidth / 2, window.innerHeight * 0.82);
}, 100);

// ---------- controls ----------
const panel = createPanel('Bloom');
panel.select('Palette', PALETTES.map((p) => p.name), params.palette.name, (name) => {
  params.palette = PALETTES.find((p) => p.name === name);
  regrow();
});
panel.slider('Spread', { min: 0.15, max: 1.2, step: 0.05, value: params.spread }, (v) => { params.spread = v; });
panel.slider('Speed', { min: 20, max: 260, step: 5, value: params.speed }, (v) => { params.speed = v; });
panel.slider('Twist', { min: 0, max: 3, step: 0.1, value: params.twist }, (v) => { params.twist = v; });
const musicBtn = panel.button('Music drive: off', async () => {
  await music.toggle();
  musicBtn.textContent = music.playing ? 'Music drive: on' : 'Music drive: off';
});
panel.buttons([
  ['Regrow', regrow],
  ['Clear', clearGarden],
]);
panel.button('Export PNG', () => exportPNG(canvas, 'bloom'));
panel.note('Click anywhere to plant. With music on, growth surges with the track and blossoms pulse on the bass.');
