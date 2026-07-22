// GLYPH — your photograph rebuilt from type. Every cell of the image
// becomes a character whose size, weight and colour carry the pixels.
// Inspired by GMBermeo's katakana portraits of famous paintings; our
// twist: your own photos, four character sets, three colour voices, and
// a live shimmer that keeps the portrait quietly retyping itself.
import { PALETTES, samplePalette } from './lib/palettes.js';
import { createPanel } from './lib/panel.js';
import { createSketch, exportPNG } from './lib/sketch.js';
import { IMAGES, loadImage, imageToData } from './lib/images.js';
import { clamp } from './lib/random.js';

const canvas = document.getElementById('canvas');

const CHARSETS = {
  Katakana: { chars: 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン', ordered: false },
  Latin: { chars: 'AEFHIKLMNRTVWXYZ', ordered: false },
  Digits: { chars: '0123456789', ordered: false },
  Density: { chars: ' ·:-=+*#%@', ordered: true },
};

const params = {
  imageIndex: 2,
  charset: 'Katakana',
  cell: 16,
  colorMode: 'Image',   // Image | Palette | Ink
  palette: PALETTES[0],
  shimmer: true,
};

let cells = [];
let cols = 0, rows = 0;
let img = null;
let sketchState = null;

async function loadCurrent() {
  img = await loadImage(IMAGES[params.imageIndex].src);
  if (sketchState) buildCells(sketchState);
}

function pickChar(set, bright, rand = Math.random) {
  if (set.ordered) {
    return set.chars[Math.min(set.chars.length - 1, Math.floor(bright * set.chars.length))];
  }
  return set.chars[Math.floor(rand() * set.chars.length)];
}

function buildCells({ width, height }) {
  if (!img || !width) return;
  cols = Math.floor(width / params.cell);
  rows = Math.floor(height / params.cell);
  const data = imageToData(img, cols, rows).data;
  const set = CHARSETS[params.charset];

  // auto-contrast: stretch luminance between the 5th and 95th percentile
  // so even a dark photograph types out across the full range
  const lums = new Float32Array(cols * rows);
  for (let k = 0; k < cols * rows; k++) {
    lums[k] = (0.2126 * data[k * 4] + 0.7152 * data[k * 4 + 1] + 0.0722 * data[k * 4 + 2]) / 255;
  }
  const sorted = Float32Array.from(lums).sort();
  const lo = sorted[(sorted.length * 0.05) | 0];
  const hi = sorted[(sorted.length * 0.95) | 0];
  const range = Math.max(0.05, hi - lo);

  cells = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const k = (j * cols + i) * 4;
      const r = data[k], g = data[k + 1], b = data[k + 2];
      const bright = clamp((lums[j * cols + i] - lo) / range, 0, 1);
      if (bright < 0.06) continue;
      // gain lifts the pixel's colour toward its normalized brightness
      const gain = clamp((0.2 + bright * 0.9) / Math.max(lums[j * cols + i], 0.02), 1, 5);
      cells.push({
        x: (i + 0.5) * params.cell,
        y: (j + 0.5) * params.cell,
        r: clamp(r * gain, 0, 255) | 0,
        g: clamp(g * gain, 0, 255) | 0,
        b: clamp(b * gain, 0, 255) | 0,
        bright,
        char: pickChar(set, bright),
        big: Math.random() < 0.06,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }
}

function render(ctx, state) {
  const { width, height, time } = state;
  const pal = params.palette;
  const set = CHARSETS[params.charset];

  ctx.fillStyle = params.colorMode === 'Image' ? '#0a0a0e' : pal.background;
  ctx.fillRect(0, 0, width, height);

  if (!cells.length) return;

  // shimmer: a small fraction of glyphs quietly retype each frame
  if (params.shimmer && !set.ordered) {
    const n = Math.max(1, cells.length * 0.004 | 0);
    for (let k = 0; k < n; k++) {
      const c = cells[(Math.random() * cells.length) | 0];
      c.char = pickChar(set, c.bright);
    }
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const c of cells) {
    const tw = params.shimmer ? 0.85 + Math.sin(time * 1.4 + c.phase) * 0.15 : 1;
    let fill;
    if (params.colorMode === 'Image') {
      fill = `rgba(${c.r},${c.g},${c.b},${(0.35 + c.bright * 0.65) * tw})`;
    } else if (params.colorMode === 'Palette') {
      const [r, g, b] = samplePalette(pal, c.bright);
      fill = `rgba(${r},${g},${b},${(0.3 + c.bright * 0.7) * tw})`;
    } else {
      fill = `rgba(236,231,219,${(0.14 + c.bright * 0.86) * tw})`;
    }
    ctx.fillStyle = fill;
    const size = params.cell * (0.55 + c.bright * 0.75) * (c.big ? 1.9 : 1);
    ctx.font = `${size}px "Segoe UI", "Yu Gothic", system-ui, monospace`;
    ctx.fillText(c.char, c.x, c.y);
  }
}

sketchState = createSketch({
  canvas,
  render,
  onResize: (s) => { sketchState = s; buildCells(s); },
}).state;
loadCurrent();

// ---------- controls ----------
const panel = createPanel('Glyph');
panel.select('Image', IMAGES.map((i) => i.name), IMAGES[params.imageIndex].name, (name) => {
  params.imageIndex = IMAGES.findIndex((i) => i.name === name);
  loadCurrent();
});
panel.select('Charset', Object.keys(CHARSETS), params.charset, (name) => {
  params.charset = name;
  buildCells(sketchState);
});
panel.select('Colour', ['Image', 'Palette', 'Ink'], params.colorMode, (v) => { params.colorMode = v; });
panel.select('Palette', PALETTES.map((p) => p.name), params.palette.name, (name) => {
  params.palette = PALETTES.find((p) => p.name === name);
});
panel.slider('Cell', { min: 8, max: 40, step: 1, value: params.cell }, (v) => {
  params.cell = v;
  buildCells(sketchState);
});
panel.toggle('Shimmer', params.shimmer, (v) => { params.shimmer = v; });
panel.button('Export PNG', () => exportPNG(canvas, 'glyph'));
panel.note('The portrait keeps quietly retyping itself. "Density" is a brightness-ordered set — the others choose characters freely.');
