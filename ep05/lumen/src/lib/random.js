// Seeded, reproducible randomness (mulberry32).
export function createRandom(seed = Date.now() & 0xffffffff) {
  let s = seed >>> 0;
  const next = () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    seed,
    value: next,
    range: (min, max) => min + next() * (max - min),
    rangeFloor: (min, max) => Math.floor(min + next() * (max - min)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p = 0.5) => next() < p,
    gaussian: (mean = 0, std = 1) => {
      const u = 1 - next();
      const v = next();
      return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
  };
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const mapRange = (v, inMin, inMax, outMin, outMax, doClamp = false) => {
  const t = (v - inMin) / (inMax - inMin);
  const out = outMin + t * (outMax - outMin);
  return doClamp ? clamp(out, Math.min(outMin, outMax), Math.max(outMin, outMax)) : out;
};
export const smoothstep = (t) => t * t * (3 - 2 * t);
