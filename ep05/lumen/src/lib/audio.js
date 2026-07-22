// Lightweight music drive: plays the local track and exposes smoothed
// level + bass energy for sketches that want to breathe with the sound.
import { lerp, clamp } from './random.js';

const TRACK_URL = 'assets/audio/track.mp3';

export function createTrackDrive() {
  const drive = {
    available: false,
    playing: false,
    level: 0,
    bass: 0,
    async toggle() {},
    update() {},
  };

  let ctx = null;
  let analyser = null;
  let data = null;
  let el = null;

  fetch(TRACK_URL, { method: 'HEAD' })
    .then((res) => {
      const type = res.headers.get('content-type') ?? '';
      drive.available = res.ok && type.startsWith('audio');
    })
    .catch(() => {});

  drive.toggle = async () => {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      data = new Uint8Array(analyser.frequencyBinCount);
      el = new Audio(TRACK_URL);
      el.loop = true;
      const src = ctx.createMediaElementSource(el);
      src.connect(analyser);
      analyser.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') await ctx.resume();
    if (el.paused) { await el.play(); drive.playing = true; }
    else { el.pause(); drive.playing = false; }
  };

  drive.update = () => {
    if (!analyser || !drive.playing) {
      drive.level = lerp(drive.level, 0, 0.05);
      drive.bass = lerp(drive.bass, 0, 0.05);
      return;
    }
    analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    let bassSum = 0;
    const bassBins = 10;
    for (let i = 0; i < bassBins; i++) bassSum += data[i];
    const level = clamp(sum / data.length / 255, 0, 1);
    const bass = clamp(bassSum / bassBins / 255, 0, 1);
    drive.level = lerp(drive.level, level, level > drive.level ? 0.4 : 0.08);
    drive.bass = lerp(drive.bass, bass, bass > drive.bass ? 0.5 : 0.1);
  };

  return drive;
}
