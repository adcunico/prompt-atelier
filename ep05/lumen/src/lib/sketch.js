// Minimal sketch runner: fullscreen canvas, devicePixelRatio scaling, RAF loop.
export function createSketch({ canvas, render, onResize, animate = true }) {
  const ctx = canvas.getContext('2d');
  const state = {
    width: 0,
    height: 0,
    dpr: Math.min(2, window.devicePixelRatio || 1),
    time: 0,
    frame: 0,
    playing: animate,
  };

  function resize() {
    state.width = canvas.clientWidth;
    state.height = canvas.clientHeight;
    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    onResize?.(state);
    if (!state.playing) draw(lastNow);
  }

  let lastNow = performance.now();
  function draw(now) {
    const dt = Math.min(0.05, (now - lastNow) / 1000);
    lastNow = now;
    state.time += dt;
    state.frame++;
    render(ctx, state, dt);
  }

  function loop(now) {
    if (state.playing) draw(now);
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame((now) => {
    lastNow = now;
    if (!state.playing) draw(now);
    requestAnimationFrame(loop);
  });

  const api = {
    state,
    ctx,
    redraw: () => draw(performance.now()),
    play: () => { state.playing = true; },
    pause: () => { state.playing = false; },
  };
  window.__sketch = api; // debug handle (lets tools force a frame while the tab is hidden)
  return api;
}

export function exportPNG(canvas, name = 'sketch') {
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
}
