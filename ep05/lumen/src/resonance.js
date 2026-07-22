// RESONANCE — a radial instrument. Frequency bands become luminous arcs
// orbiting a waveform ring; the whole form breathes with the sound.
// Descended from the course audio sketches, redesigned around three inputs:
// a local track, any dropped audio file, or the microphone.
import { createNoise } from './lib/noise.js';
import { PALETTES, samplePalette } from './lib/palettes.js';
import { createPanel } from './lib/panel.js';
import { createSketch, exportPNG } from './lib/sketch.js';
import { lerp, clamp } from './lib/random.js';

const canvas = document.getElementById('canvas');
const fileInput = document.getElementById('file-input');
const noise = createNoise(31);

const TRACK_URL = '/assets/audio/track.mp3';
const BANDS = 56;

const params = {
  palette: PALETTES[1],
  sensitivity: 1.0,
  bloom: 0.7,
  rotation: 0.06,
};

let audioCtx = null;
let analyser = null;
let freqData = null;
let waveData = null;
let audioEl = null;
let elSource = null;
let micStream = null;
let micSource = null;
let sourceLabel = 'idle';

const bands = new Float32Array(BANDS);       // smoothed band levels 0..1
let level = 0;                                // smoothed overall level

function ensureContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.82;
    freqData = new Uint8Array(analyser.frequencyBinCount);
    waveData = new Uint8Array(analyser.fftSize);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function stopMic() {
  micStream?.getTracks().forEach((t) => t.stop());
  micSource?.disconnect();
  micStream = micSource = null;
}

function playUrl(url, label) {
  ensureContext();
  stopMic();
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.loop = true;
    audioEl.crossOrigin = 'anonymous';
    elSource = audioCtx.createMediaElementSource(audioEl);
  }
  elSource.disconnect();
  elSource.connect(analyser);
  analyser.disconnect();
  analyser.connect(audioCtx.destination);
  audioEl.src = url;
  audioEl.play();
  sourceLabel = label;
  updateStatus();
}

async function useMic() {
  ensureContext();
  audioEl?.pause();
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micSource = audioCtx.createMediaStreamSource(micStream);
    analyser.disconnect(); // don't feed the mic back to the speakers
    micSource.connect(analyser);
    sourceLabel = 'microphone';
  } catch {
    sourceLabel = 'mic blocked';
  }
  updateStatus();
}

function togglePause() {
  if (sourceLabel === 'microphone') return;
  if (!audioEl) return;
  audioEl.paused ? audioEl.play() : audioEl.pause();
}

// drag & drop any audio file
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('audio')) {
    playUrl(URL.createObjectURL(file), file.name);
  }
});
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) playUrl(URL.createObjectURL(file), file.name);
});

function updateAudio() {
  if (!analyser) return;
  analyser.getByteFrequencyData(freqData);
  analyser.getByteTimeDomainData(waveData);

  // group bins into log-spaced bands
  const nyquist = freqData.length;
  let sum = 0;
  for (let b = 0; b < BANDS; b++) {
    const lo = Math.floor(Math.pow(nyquist, b / BANDS));
    const hi = Math.max(lo + 1, Math.floor(Math.pow(nyquist, (b + 1) / BANDS)));
    let acc = 0;
    for (let i = lo; i < hi; i++) acc += freqData[Math.min(i, nyquist - 1)];
    const raw = clamp((acc / (hi - lo) / 255) * params.sensitivity, 0, 1);
    bands[b] = lerp(bands[b], raw, raw > bands[b] ? 0.5 : 0.08); // fast attack, slow release
    sum += bands[b];
  }
  level = lerp(level, sum / BANDS, 0.1);
}

function render(ctx, { width, height, time }) {
  updateAudio();
  const pal = params.palette;
  const cx = width / 2;
  const cy = height / 2;
  const R = Math.min(width, height) * 0.30;

  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, width, height);

  // breathing backdrop
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * (2.2 + level * 1.2));
  halo.addColorStop(0, `rgba(255,255,255,${0.03 + level * 0.06})`);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, width, height);

  const idle = !analyser;
  const spin = time * params.rotation * Math.PI * 2;

  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';

  // frequency arcs
  for (let b = 0; b < BANDS; b++) {
    const tB = b / (BANDS - 1);
    const amp = idle
      ? (noise.noise3D(tB * 3, 0, time * 0.4) + 1) * 0.22
      : bands[b];
    const a0 = spin + tB * Math.PI * 2;
    const span = (Math.PI * 2 / BANDS) * (0.5 + amp * 1.6);
    const radius = R * (0.78 + tB * 0.55) + amp * R * 0.5;
    const [r, g, bl] = samplePalette(pal, tB);
    const alpha = 0.12 + amp * 0.75;

    ctx.strokeStyle = `rgba(${r},${g},${bl},${alpha})`;
    ctx.lineWidth = 2 + amp * 14;
    ctx.shadowColor = `rgba(${r},${g},${bl},${amp * params.bloom})`;
    ctx.shadowBlur = 24 * params.bloom;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, a0 - span / 2, a0 + span / 2);
    ctx.stroke();

    // mirrored inner echo
    ctx.lineWidth = 1 + amp * 4;
    ctx.strokeStyle = `rgba(${r},${g},${bl},${alpha * 0.5})`;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.72 - amp * R * 0.28, -a0 - span / 2, -a0 + span / 2);
    ctx.stroke();
  }

  // waveform ring
  ctx.shadowBlur = 0;
  const ringR = R * 0.62;
  const [ir, ig, ib] = samplePalette(pal, 0.15 + level * 0.6);
  ctx.strokeStyle = `rgba(${ir},${ig},${ib},0.85)`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  const N = 256;
  for (let i = 0; i <= N; i++) {
    const tN = i / N;
    const a = tN * Math.PI * 2 + spin * 0.5;
    let wob;
    if (idle || !waveData) {
      wob = noise.noise3D(Math.cos(a), Math.sin(a), time * 0.5) * 6;
    } else {
      const s = (waveData[Math.floor(tN * (waveData.length - 1))] - 128) / 128;
      wob = s * 30 * params.sensitivity;
    }
    const rr = ringR + wob;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  ctx.globalCompositeOperation = 'source-over';

  // idle hint
  if (idle) {
    ctx.fillStyle = 'rgba(236,231,219,0.55)';
    ctx.font = '13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('choose a sound source in the panel — or drop an audio file anywhere', cx, cy + R * 2.1);
  }
}

createSketch({ canvas, render });

// ---------- controls ----------
const panel = createPanel('Resonance');
let statusNote;
function updateStatus() {
  statusNote.textContent = `source: ${sourceLabel}`;
}

panel.select('Palette', PALETTES.map((p) => p.name), params.palette.name, (name) => {
  params.palette = PALETTES.find((p) => p.name === name);
});
panel.slider('Sensitivity', { min: 0.4, max: 2.5, step: 0.05, value: params.sensitivity }, (v) => { params.sensitivity = v; });
panel.slider('Bloom', { min: 0, max: 1.5, step: 0.05, value: params.bloom }, (v) => { params.bloom = v; });
panel.slider('Rotation', { min: 0, max: 0.3, step: 0.01, value: params.rotation }, (v) => { params.rotation = v; });

const trackBtn = panel.button('Play track', () => playUrl(TRACK_URL, 'Particle Pulse'), { primary: true });
trackBtn.disabled = true;
fetch(TRACK_URL, { method: 'HEAD' })
  .then((res) => {
    const type = res.headers.get('content-type') ?? '';
    if (res.ok && type.startsWith('audio')) trackBtn.disabled = false;
    else trackBtn.textContent = 'Track not found (add assets/audio/track.mp3)';
  })
  .catch(() => { trackBtn.textContent = 'Track not found (add assets/audio/track.mp3)'; });

panel.buttons([
  ['Use microphone', useMic],
  ['Open file…', () => fileInput.click()],
]);
panel.button('Play / pause', togglePause);
panel.button('Export PNG', () => exportPNG(canvas, 'resonance'));
statusNote = panel.note('source: none — drop an audio file anywhere on the page');
