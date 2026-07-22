// Live miniature previews on the gallery cards.
import { createNoise } from './lib/noise.js';
import { PALETTES, rgba, samplePalette } from './lib/palettes.js';
import { createRandom } from './lib/random.js';

const noise = createNoise(7);

const previews = {
  // Miniature Tessellate: drifting skewed slabs.
  tessellate(ctx, w, h, t) {
    const pal = PALETTES[0];
    ctx.fillStyle = pal.background;
    ctx.fillRect(0, 0, w, h);
    const rand = createRandom(42);
    const cols = 6, rows = 5;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = ((i + 0.5) / cols) * w;
        const y = ((j + 0.5) / rows) * h;
        const n = noise.noise3D(i * 0.4, j * 0.4, t * 0.15);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-0.35 + n * 0.25);
        ctx.transform(1, 0, Math.tan(-0.5), 1, 0, 0);
        const bw = rand.range(0.3, 1.4) * (w / cols);
        const bh = 6 + rand.value() * 6;
        const c = rand.pick(pal.colors);
        ctx.fillStyle = rgba(c, 0.85);
        ctx.shadowColor = rgba(c, 0.7);
        ctx.shadowBlur = 14;
        ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
        ctx.restore();
      }
    }
  },

  // Miniature Silk: layered flowing lines.
  silk(ctx, w, h, t) {
    const pal = PALETTES[5];
    ctx.fillStyle = pal.background;
    ctx.fillRect(0, 0, w, h);
    const lines = 26;
    for (let j = 0; j < lines; j++) {
      const ty = j / (lines - 1);
      const y0 = ty * h;
      const [r, g, b] = samplePalette(pal, ty);
      ctx.strokeStyle = `rgba(${r},${g},${b},0.75)`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) {
        const n = noise.noise3D(x * 0.012, ty * 2.4, t * 0.3);
        const y = y0 + n * 16;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  },

  // Miniature Ember: swirling glow points.
  ember(ctx, w, h, t) {
    const pal = PALETTES[3];
    ctx.fillStyle = pal.background;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    const count = 260;
    const rand = createRandom(9);
    for (let i = 0; i < count; i++) {
      const a = rand.value() * Math.PI * 2;
      const rr = 12 + rand.value() * (Math.min(w, h) * 0.42);
      const wob = noise.noise3D(Math.cos(a) * rr * 0.02, Math.sin(a) * rr * 0.02, t * 0.25) * 14;
      const x = w / 2 + Math.cos(a + t * 0.12) * (rr + wob);
      const y = h / 2 + Math.sin(a + t * 0.12) * (rr + wob) * 0.8;
      const [r, g, b] = samplePalette(pal, rand.value());
      ctx.fillStyle = `rgba(${r},${g},${b},0.8)`;
      ctx.beginPath();
      ctx.arc(x, y, rand.value() < 0.9 ? 1.1 : 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  },

  // Miniature Murmuration: a wheeling pseudo-flock.
  murmuration(ctx, w, h, t) {
    const pal = PALETTES[2];
    ctx.fillStyle = pal.background;
    ctx.fillRect(0, 0, w, h);
    const rand = createRandom(5);
    const cx = w / 2 + Math.cos(t * 0.4) * w * 0.12;
    const cy = h / 2 + Math.sin(t * 0.55) * h * 0.12;
    for (let i = 0; i < 130; i++) {
      const seed = rand.value();
      const a = seed * Math.PI * 2 + t * (0.5 + seed * 0.4);
      const rr = 14 + seed * Math.min(w, h) * 0.38
        + noise.noise3D(seed * 5, 0, t * 0.3) * 10;
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr * 0.75;
      const heading = a + Math.PI / 2;
      const [r, g, b] = samplePalette(pal, (seed + t * 0.05) % 1);
      ctx.strokeStyle = `rgba(${r},${g},${b},0.85)`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(heading) * 5, y + Math.sin(heading) * 5);
      ctx.stroke();
    }
  },

  // Miniature Undertow: flow-field strands.
  undertow(ctx, w, h, t) {
    const pal = PALETTES[0];
    ctx.fillStyle = pal.background;
    ctx.fillRect(0, 0, w, h);
    const rand = createRandom(3);
    for (let i = 0; i < 60; i++) {
      let x = rand.value() * w;
      let y = rand.value() * h;
      const [r, g, b] = samplePalette(pal, rand.value());
      ctx.strokeStyle = `rgba(${r},${g},${b},0.5)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let s = 0; s < 26; s++) {
        const a = noise.noise3D(x * 0.01, y * 0.01, t * 0.12) * Math.PI * 2.4;
        x += Math.cos(a) * 4;
        y += Math.sin(a) * 4;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  },

  // Miniature Bloom: a swaying branch fan.
  bloom(ctx, w, h, t) {
    const pal = PALETTES[3];
    ctx.fillStyle = pal.background;
    ctx.fillRect(0, 0, w, h);
    const sway = Math.sin(t * 0.8) * 0.06;
    const branch = (x, y, angle, len, th, depth) => {
      if (depth > 5 || len < 3) return;
      const nx = x + Math.cos(angle) * len;
      const ny = y + Math.sin(angle) * len;
      const [r, g, b] = samplePalette(pal, depth / 6);
      ctx.strokeStyle = `rgba(${r},${g},${b},0.9)`;
      ctx.lineWidth = th;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      if (depth === 5) {
        ctx.fillStyle = `rgba(${r},${g},${b},0.7)`;
        ctx.beginPath();
        ctx.arc(nx, ny, 2.2 + Math.sin(t * 2 + x) * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      branch(nx, ny, angle - 0.45 + sway, len * 0.72, th * 0.65, depth + 1);
      branch(nx, ny, angle + 0.5 + sway, len * 0.72, th * 0.65, depth + 1);
    };
    branch(w / 2, h, -Math.PI / 2 + sway, h * 0.3, 3.4, 0);
  },

  // Miniature Meridian: a rotating fibonacci dot-sphere.
  meridian(ctx, w, h, t) {
    const pal = PALETTES[5];
    ctx.fillStyle = pal.background;
    ctx.fillRect(0, 0, w, h);
    const N = 240;
    const R = Math.min(w, h) * 0.36;
    const cx = w / 2, cy = h / 2;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const yaw = t * 0.5;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < N; i++) {
      const yy = 1 - (i / (N - 1)) * 2;
      const rad = Math.sqrt(1 - yy * yy);
      const th = golden * i;
      let x = Math.cos(th) * rad, z = Math.sin(th) * rad;
      const x1 = x * Math.cos(yaw) + z * Math.sin(yaw);
      const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
      const depth = (z1 + 1) / 2;
      const [r, g, b] = samplePalette(pal, depth);
      ctx.fillStyle = `rgba(${r},${g},${b},${0.2 + depth * 0.7})`;
      const s = 0.8 + depth * 1.6;
      ctx.fillRect(cx + x1 * R - s / 2, cy + yy * R - s / 2, s, s);
    }
    ctx.globalCompositeOperation = 'source-over';
  },

  // Miniature Halo: a slowly turning mandala.
  halo(ctx, w, h, t) {
    const pal = PALETTES[1];
    ctx.fillStyle = pal.background;
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const R = Math.min(w, h) * 0.4;
    const slices = 12;
    const rand = createRandom(21);
    const items = [];
    for (let k = 0; k < 4; k++) {
      items.push({ rr: rand.range(0.3, 1), span: rand.range(0.2, 0.8), lw: rand.range(1, 3), c: rand.pick(pal.colors), slab: rand.chance(0.5) });
    }
    for (let s = 0; s < slices; s++) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.15 + (s / slices) * Math.PI * 2);
      for (const it of items) {
        ctx.strokeStyle = rgba(it.c, 0.8);
        ctx.lineWidth = it.lw;
        ctx.lineCap = 'round';
        if (it.slab) {
          ctx.strokeRect(R * it.rr - 4, -2.5, 8, 5);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, R * it.rr, -it.span / 2, it.span / 2);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  },

  // Miniature Tether: linked drifting stars.
  tether(ctx, w, h, t) {
    const pal = PALETTES[5];
    ctx.fillStyle = pal.background;
    ctx.fillRect(0, 0, w, h);
    const rand = createRandom(13);
    const pts = [];
    for (let i = 0; i < 16; i++) {
      const sx = rand.value(), sy = rand.value(), ph = rand.value() * 6;
      pts.push({
        x: (sx + Math.sin(t * 0.3 + ph) * 0.06) * w,
        y: (sy + Math.cos(t * 0.25 + ph * 1.7) * 0.06) * h,
      });
    }
    const link = Math.min(w, h) * 0.42;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[j].x - pts[i].x, dy = pts[j].y - pts[i].y;
        const d = Math.hypot(dx, dy);
        if (d > link) continue;
        const tt = 1 - d / link;
        const [r, g, b] = samplePalette(pal, 0.2 + tt * 0.6);
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.1 + tt * 0.5})`;
        ctx.lineWidth = 0.5 + tt * 1.5;
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[j].x, pts[j].y);
        ctx.stroke();
      }
    }
    for (const p of pts) {
      ctx.fillStyle = 'rgba(232,241,245,0.95)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // Miniature Weave: combed noise lattice.
  weave(ctx, w, h, t) {
    const pal = PALETTES[4];
    ctx.fillStyle = pal.background;
    ctx.fillRect(0, 0, w, h);
    const cols = 14;
    const cell = w / cols;
    const rows = Math.ceil(h / cell);
    ctx.lineCap = 'round';
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = (i + 0.5) * cell, y = (j + 0.5) * cell;
        const n = noise.noise3D(i * 0.16, j * 0.16, t * 0.25);
        const [r, g, b] = samplePalette(pal, n * 0.5 + 0.5);
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.55 + Math.abs(n) * 0.4})`;
        ctx.lineWidth = 1 + Math.abs(n) * 2.5;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(n * Math.PI * 0.8);
        ctx.beginPath();
        ctx.moveTo(-cell * 0.32, 0);
        ctx.lineTo(cell * 0.32, 0);
        ctx.stroke();
        ctx.restore();
      }
    }
  },

  // Miniature Glyph: retyping characters in a brightness vignette.
  glyph(ctx, w, h, t) {
    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(0, 0, w, h);
    const chars = 'アイウエオカキクケコサシスセソタチツ';
    const cell = 15;
    const cols = Math.floor(w / cell), rows = Math.floor(h / cell);
    const rand = createRandom(37 + Math.floor(t * 2)); // slow retype
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const pal = PALETTES[0];
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const u = (i + 0.5) / cols - 0.5, v = (j + 0.5) / rows - 0.5;
        const bright = Math.max(0, 1 - Math.hypot(u * 1.6, v * 1.9) * 1.7);
        if (bright < 0.08) continue;
        const [r, g, b] = samplePalette(pal, bright);
        ctx.fillStyle = `rgba(${r},${g},${b},${0.25 + bright * 0.75})`;
        ctx.font = `${cell * (0.5 + bright * 0.7)}px "Yu Gothic", system-ui, monospace`;
        ctx.fillText(chars[rand.rangeFloor(0, chars.length)], (i + 0.5) * cell, (j + 0.5) * cell);
      }
    }
  },

  // Miniature Resonance: pulsing arcs.
  resonance(ctx, w, h, t) {
    const pal = PALETTES[1];
    ctx.fillStyle = pal.background;
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const base = 16 + i * 13;
      const segs = 3 + i;
      for (let s = 0; s < segs; s++) {
        const amp = (noise.noise3D(i * 0.7, s * 1.3, t * 0.6) + 1) * 0.5;
        const a0 = (s / segs) * Math.PI * 2 + t * (0.1 + i * 0.05);
        const a1 = a0 + (Math.PI * 2 / segs) * (0.35 + amp * 0.5);
        const [r, g, b] = samplePalette(pal, i / 4);
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.35 + amp * 0.55})`;
        ctx.lineWidth = 2 + amp * 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(cx, cy, base + amp * 6, a0, a1);
        ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  },
};

for (const card of document.querySelectorAll('.card[data-preview]')) {
  const canvas = card.querySelector('canvas');
  const kind = card.dataset.preview;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);

  function resize() {
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
  }
  resize();
  window.addEventListener('resize', resize);

  function drawOnce(now) {
    ctx.save();
    ctx.scale(dpr, dpr);
    previews[kind](ctx, canvas.clientWidth, canvas.clientHeight, now / 1000);
    ctx.restore();
  }

  function frame(now) {
    drawOnce(now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  (window.__previewDraws ??= []).push(drawOnce); // debug handle
}
