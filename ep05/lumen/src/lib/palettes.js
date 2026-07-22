// Curated palettes. Each: name, background, ink (soft foreground), colors.
export const PALETTES = [
  {
    name: 'Nocturne',
    background: '#0b0b12',
    ink: '#e9e2d0',
    colors: ['#f5d491', '#e8a87c', '#c38d9e', '#41b3a3', '#e27d60'],
  },
  {
    name: 'Aurora',
    background: '#070b14',
    ink: '#dce8f2',
    colors: ['#22e0a5', '#4cc9f0', '#b5179e', '#f72585', '#8557f7'],
  },
  {
    name: 'Ukiyo',
    background: '#101418',
    ink: '#efe6d5',
    colors: ['#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#8ab17d'],
  },
  {
    name: 'Velvet',
    background: '#0d0714',
    ink: '#f2e5ff',
    colors: ['#ffb703', '#ff6d00', '#e500a4', '#9d4edd', '#4361ee'],
  },
  {
    name: 'Porcelain',
    background: '#f2ede3',
    ink: '#2b2620',
    colors: ['#0f4c5c', '#e36414', '#9a031e', '#c9a227', '#5f0f40'],
  },
  {
    name: 'Glacier',
    background: '#0a0e14',
    ink: '#e8f1f5',
    colors: ['#8ecae6', '#5390d9', '#48bfe3', '#80ffdb', '#b8c0ff'],
  },
];

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(hex, alpha = 1) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Smooth color sampling along the palette, t in [0,1].
export function samplePalette(palette, t) {
  const cols = palette.colors;
  const x = Math.min(0.9999, Math.max(0, t)) * (cols.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const a = hexToRgb(cols[i]);
  const b = hexToRgb(cols[i + 1] ?? cols[i]);
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f),
  ];
}
