/* FORGE & FUMÉE — The Solstice
   Scroll-scrubbed canvas sequences · Lenis · GSAP ScrollTrigger
   + custom cursor, counters, parallax, ceremonial loader */

gsap.registerPlugin(ScrollTrigger);

const FRAME_PATH = (seq, i) => `assets/frames/${seq}/frame-${String(i + 1).padStart(3, "0")}.jpg`;

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Safety net: nothing that carries text may stay invisible. If GSAP fails to
// load, a ScrollTrigger never fires, or motion is reduced, reveal every
// text layer at full opacity so the page is always readable.
function forceRevealAll() {
  document
    .querySelectorAll(".reveal, .beat, .overlay-card, .spec, .engineering-title, .macro-line")
    .forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
      el.style.visibility = "visible";
    });
}
if (typeof gsap === "undefined" || REDUCED) forceRevealAll();
// Last-resort guard in case init() throws before reveals are wired.
setTimeout(() => {
  document.querySelectorAll(".reveal").forEach((el) => {
    if (getComputedStyle(el).opacity === "0") { el.style.opacity = "1"; el.style.transform = "none"; }
  });
}, 4000);

// ---------- Lenis smooth scroll ----------
const lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 0.9 });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

// anchor links routed through Lenis
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const target = document.querySelector(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: 0, duration: 1.6 });
  });
});

// ---------- custom cursor ----------
(() => {
  if (!matchMedia("(pointer: fine)").matches) return;
  const dot = document.getElementById("cursor-dot");
  const ring = document.getElementById("cursor-ring");
  const pos = { x: -100, y: -100 };
  const ringPos = { x: -100, y: -100 };
  window.addEventListener("mousemove", (e) => {
    pos.x = e.clientX;
    pos.y = e.clientY;
  });
  gsap.ticker.add(() => {
    ringPos.x += (pos.x - ringPos.x) * 0.14;
    ringPos.y += (pos.y - ringPos.y) * 0.14;
    dot.style.left = `${pos.x}px`;
    dot.style.top = `${pos.y}px`;
    ring.style.left = `${ringPos.x}px`;
    ring.style.top = `${ringPos.y}px`;
  });
  document.querySelectorAll("[data-hover]").forEach((el) => {
    el.addEventListener("mouseenter", () => document.body.classList.add("cursor-hover"));
    el.addEventListener("mouseleave", () => document.body.classList.remove("cursor-hover"));
  });
})();

// ---------- boot ----------
init().catch((err) => { console.error(err); forceRevealAll(); document.getElementById("loader").classList.add("done"); });

async function init() {
  const manifest = await fetch("assets/frames/manifest.json")
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}));

  const pct = document.getElementById("loader-pct");
  const progress = { total: 0, done: 0 };
  const tick = () => {
    const v = progress.total ? Math.round((progress.done / progress.total) * 100) : 100;
    pct.textContent = String(Math.min(v, 100)).padStart(2, "0");
  };

  const sections = document.querySelectorAll(".pin-section");
  const loaders = [];
  for (const section of sections) {
    const seq = section.dataset.seq;
    const count = manifest[seq] || 0;
    if (!count) {
      section.classList.add("no-frames");
      setupCues(section); // callouts still fire over the poster
      continue;
    }
    progress.total += count;
    loaders.push(setupSequence(section, seq, count, () => { progress.done += 1; tick(); }));
  }
  tick();
  await Promise.all(loaders);
  pct.textContent = "100";

  setTimeout(() => document.getElementById("loader").classList.add("done"), 350);
  heroIntro();
  reveals();
  counters();
  parallax();
  ScrollTrigger.refresh();
}

// ---------- canvas frame sequence ----------
async function setupSequence(section, seq, count, onFrame) {
  const canvas = section.querySelector(".seq-canvas");
  const ctx = canvas.getContext("2d");
  const images = new Array(count);
  const state = { frame: 0 };

  const load = (i) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { images[i] = img; onFrame(); resolve(img); };
      img.onerror = () => { onFrame(); resolve(null); };
      img.src = FRAME_PATH(seq, i);
    });

  await load(0);
  sizeCanvas();
  draw();
  const rest = [];
  for (let i = 1; i < count; i += 1) rest.push(load(i));

  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
  }

  function draw() {
    const img = images[Math.round(state.frame)] || images[0];
    if (!img) return;
    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.max(cw / img.width, ch / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  window.addEventListener("resize", () => { sizeCanvas(); draw(); });

  gsap.to(state, {
    frame: count - 1,
    ease: "none",
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.4,
      onUpdate: draw,
    },
  });

  setupCues(section);
  return Promise.all(rest);
}

// in-viewport copy driven by section scroll progress.
// Each cue lives on a scrub-locked timeline: fades in at data-at,
// and (if data-out is set) fades back out at data-out — so overlays
// ride the footage instead of stacking up over it.
function setupCues(section) {
  const cues = section.querySelectorAll("[data-at]");
  if (!cues.length) return;
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
    },
  });
  tl.to({}, { duration: 1 }); // normalize timeline length to section progress 0..1
  cues.forEach((el) => {
    const at = parseFloat(el.dataset.at);
    const out = el.dataset.out ? parseFloat(el.dataset.out) : null;
    tl.fromTo(
      el,
      { autoAlpha: 0, y: 26 },
      { autoAlpha: 1, y: 0, duration: 0.06, ease: "none" },
      at
    );
    if (out) tl.to(el, { autoAlpha: 0, y: -20, duration: 0.05, ease: "none" }, out);
  });
}

// ---------- hero intro ----------
function heroIntro() {
  const title = document.getElementById("brand-title");
  const text = "FORGE & FUMÉE";
  title.innerHTML = [...text]
    .map((c) => {
      if (c === " ") return "<span class='ch'>&nbsp;</span>";
      const cls = c === "&" ? "ch amp" : "ch";
      return `<span class="${cls}">${c}</span>`;
    })
    .join("");

  gsap.to(".hero-overline", { opacity: 1, duration: 1.2, delay: 0.2, ease: "power2.out" });
  gsap.to("#brand-title .ch", {
    opacity: 1, y: 0, filter: "blur(0px)",
    duration: 1.1, stagger: 0.055, ease: "power3.out", delay: 0.45,
  });
  gsap.to(".hero-sub", { opacity: 1, duration: 1.4, delay: 1.6, ease: "power2.out" });
  gsap.to(".scroll-hint", { opacity: 1, duration: 1.4, delay: 2.2, ease: "power2.out" });
  gsap.from(".hero-meta", { opacity: 0, y: 12, duration: 1.4, delay: 2.0, ease: "power2.out" });

  gsap.to(".hero-titles", {
    opacity: 0,
    ease: "none",
    scrollTrigger: { trigger: "#hero", start: "top top", end: "18% top", scrub: true },
  });
}

// ---------- generic reveals ----------
function reveals() {
  if (REDUCED) return forceRevealAll();
  document.querySelectorAll(".reveal").forEach((el) => {
    gsap.to(el, {
      opacity: 1, y: 0,
      duration: 1.2, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });
  // If anything scrolled past before its trigger armed, ensure it still shows.
  ScrollTrigger.addEventListener("refresh", () => {
    document.querySelectorAll(".reveal").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.88 && getComputedStyle(el).opacity === "0") {
        gsap.to(el, { opacity: 1, y: 0, duration: 0.6 });
      }
    });
  });
}

// ---------- counters ----------
function counters() {
  document.querySelectorAll(".number-val").forEach((el) => {
    const target = Number(el.dataset.count);
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 2.2,
      ease: "power2.out",
      snap: { v: 1 },
      scrollTrigger: { trigger: el, start: "top 85%" },
      onUpdate: () => { el.textContent = String(Math.round(obj.v)); },
    });
  });
}

// ---------- parallax stills ----------
function parallax() {
  document.querySelectorAll(".parallax").forEach((el) => {
    const speed = Number(el.dataset.speed || -6);
    gsap.fromTo(
      el.querySelector("img"),
      { yPercent: -speed },
      {
        yPercent: speed,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 },
      }
    );
  });
}

// ---------- waitlist (demo) ----------
document.getElementById("waitlist-form").addEventListener("submit", (e) => {
  e.preventDefault();
  e.target.style.display = "none";
  document.getElementById("waitlist-confirm").hidden = false;
});
