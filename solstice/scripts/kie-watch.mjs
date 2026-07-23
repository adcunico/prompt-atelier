#!/usr/bin/env node
// FORGE & FUMÉE "Solstice" — Kie.ai generation pipeline
// Models: seedream/5-pro-text-to-image (hero image),
//         bytedance/seedance-2 @720p (clips), topaz/video-upscale 2x
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";

const API_BASE = "https://api.kie.ai";
const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const OUT = join(ROOT, "outputs");
const PROMPTS = join(ROOT, "prompts");
const STATE_PATH = join(OUT, "state.json");
const CLIPS = ["orbit", "macro", "assembly"];

loadDotEnv();
for (const dir of ["images", "videos", "frames", "tasks"]) mkdirSync(join(OUT, dir), { recursive: true });

const args = parseArgs(process.argv.slice(2));
const command = args._[0] || "help";
const state = existsSync(STATE_PATH) ? JSON.parse(readFileSync(STATE_PATH, "utf8")) : { hero: {}, clips: {} };

switch (command) {
  case "check": {
    const json = await kieFetch(`${API_BASE}/api/v1/chat/credit`);
    console.log(`Kie credit balance: ${json.data}`);
    break;
  }
  case "image": {
    const take = String(args.take || 1);
    const payload = {
      model: "seedream/5-pro-text-to-image",
      input: {
        prompt: readPrompt("hero-image"),
        aspect_ratio: "16:9",
        quality: "high",
        output_format: "png"
      }
    };
    writeJson(join(OUT, "tasks", `hero-image-t${take}.payload.json`), payload);
    if (args.dry_run) { console.log(`Dry run: wrote hero-image take ${take} payload (cost would be 14 credits).`); break; }
    const url = await runTask(payload, `hero-image-t${take}`);
    const file = await download(url, join(OUT, "images", `hero-image-t${take}`));
    state.hero[take] = { url, file };
    saveState();
    console.log(`Hero image take ${take}: ${file}\nRemote URL: ${url}`);
    break;
  }
  case "choose-image": {
    const take = String(args.take || 1);
    if (!state.hero[take]) throw new Error(`No hero image take ${take} in state.`);
    state.hero.chosen = take;
    saveState();
    console.log(`Chosen hero image: take ${take} (${state.hero[take].url})`);
    break;
  }
  case "clip": {
    const name = args.name;
    if (!CLIPS.includes(name)) throw new Error(`--name must be one of: ${CLIPS.join(", ")}`);
    const chosen = state.hero[state.hero.chosen];
    if (!chosen && !args.dry_run) throw new Error("No chosen hero image. Run: image, then choose-image --take N");
    const take = String(args.take || 1);
    const input = {
      prompt: readPrompt(`clip-${name}`),
      reference_image_urls: [chosen ? chosen.url : "https://example.com/dry-run-hero.png"],
      generate_audio: false,
      resolution: "720p",
      aspect_ratio: "16:9",
      duration: Number(args.duration || 8)
    };
    if (args.first_frame) input.first_frame_url = chosen ? chosen.url : input.reference_image_urls[0];
    const payload = { model: "bytedance/seedance-2", input };
    writeJson(join(OUT, "tasks", `clip-${name}-t${take}.payload.json`), payload);
    if (args.dry_run) { console.log(`Dry run: wrote clip-${name} take ${take} payload (cost would be ${41 * input.duration} credits).`); break; }
    const url = await runTask(payload, `clip-${name}-t${take}`);
    const file = await download(url, join(OUT, "videos", `clip-${name}-t${take}`));
    state.clips[name] = state.clips[name] || {};
    state.clips[name][take] = { url, file };
    saveState();
    console.log(`Clip ${name} take ${take}: ${file}\nRemote URL: ${url}`);
    break;
  }
  case "choose-clip": {
    const name = args.name;
    const take = String(args.take || 1);
    if (!state.clips[name]?.[take]) throw new Error(`No ${name} take ${take} in state.`);
    state.clips[name].chosen = take;
    saveState();
    console.log(`Chosen ${name}: take ${take}`);
    break;
  }
  case "upscale": {
    const name = args.name;
    const entry = state.clips[name]?.[state.clips[name]?.chosen];
    if (!entry && !args.dry_run) throw new Error(`No chosen ${name} clip. Run choose-clip first.`);
    const payload = {
      model: "topaz/video-upscale",
      input: { video_url: entry ? entry.url : "https://example.com/dry-run.mp4", upscale_factor: "2" }
    };
    writeJson(join(OUT, "tasks", `upscale-${name}.payload.json`), payload);
    if (args.dry_run) { console.log(`Dry run: wrote upscale-${name} payload (cost would be ~${8 * 8} credits for 8s).`); break; }
    const url = await runTask(payload, `upscale-${name}`);
    const raw = await download(url, join(OUT, "videos", `clip-${name}-upscaled-raw`));
    const final = join(OUT, "videos", `clip-${name}-1080p.mp4`);
    execFileSync("ffmpeg", ["-y", "-i", raw, "-vf", "scale=1920:1080:flags=lanczos", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "slow", "-crf", "17", "-an", "-movflags", "+faststart", final], { stdio: "inherit" });
    state.clips[name].upscaled = { url, file: final };
    saveState();
    console.log(`Upscaled ${name}: ${final}`);
    break;
  }
  case "frames": {
    const name = args.name;
    const src = state.clips[name]?.upscaled?.file || state.clips[name]?.[state.clips[name]?.chosen]?.file;
    if (!src) throw new Error(`No video on disk for ${name}.`);
    const dir = join(OUT, "frames", name);
    mkdirSync(dir, { recursive: true });
    const fps = Number(args.fps || 15);
    execFileSync("ffmpeg", ["-y", "-i", src, "-vf", `fps=${fps},scale=1600:-2`, "-qscale:v", "3", join(dir, "frame-%03d.jpg")], { stdio: "inherit" });
    console.log(`Frames extracted to ${dir}`);
    break;
  }
  default:
    console.log(`Commands:
  check                                  balance
  image [--take N] [--dry-run]           hero image (14 cr)
  choose-image --take N                  mark winning hero image
  clip --name orbit|macro|assembly [--take N] [--first-frame] [--duration 8] [--dry-run]   (328 cr @ 8s)
  choose-clip --name X --take N          mark winning take
  upscale --name X [--dry-run]           Topaz 2x on chosen take (~64 cr @ 8s)
  frames --name X [--fps 15]             extract scrub frames`);
}

function loadDotEnv() {
  const envPath = join(ROOT, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

function parseArgs(raw) {
  const parsed = { _: [] };
  for (let i = 0; i < raw.length; i += 1) {
    const token = raw[i];
    if (!token.startsWith("--")) { parsed._.push(token); continue; }
    const key = token.slice(2).replaceAll("-", "_");
    const next = raw[i + 1];
    if (!next || next.startsWith("--")) parsed[key] = true;
    else { parsed[key] = next; i += 1; }
  }
  return parsed;
}

function readPrompt(name) {
  return readFileSync(join(PROMPTS, `${name}.txt`), "utf8");
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function saveState() {
  writeJson(STATE_PATH, state);
}

async function kieFetch(url, options = {}) {
  const key = process.env.KIE_API_KEY;
  if (!key) throw new Error("Set KIE_API_KEY in .env");
  const res = await fetch(url, { ...options, headers: { Authorization: `Bearer ${key}`, ...(options.headers || {}) } });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`Non-JSON from ${url}: ${text.slice(0, 300)}`); }
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(json)}`);
  return json;
}

async function runTask(payload, label) {
  const task = await kieFetch(`${API_BASE}/api/v1/jobs/createTask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  writeJson(join(OUT, "tasks", `${label}.task.json`), task);
  if (!task.data?.taskId) throw new Error(`No taskId for ${label}: ${JSON.stringify(task)}`);
  const result = await poll(task.data.taskId);
  writeJson(join(OUT, "tasks", `${label}.result.json`), result);
  const urls = resultUrls(result);
  if (!urls.length) throw new Error(`No result URL for ${label}.`);
  return urls[0];
}

async function poll(taskId) {
  const started = Date.now();
  while (Date.now() - started < 900000) {
    await new Promise((r) => setTimeout(r, 5000));
    const json = await kieFetch(`${API_BASE}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`);
    const s = json.data?.state;
    process.stdout.write(`Task ${taskId}: ${s || "unknown"}\n`);
    if (s === "success") return json;
    if (s === "fail") throw new Error(`Task failed: ${json.data?.failCode || ""} ${json.data?.failMsg || ""}`);
  }
  throw new Error(`Timed out polling ${taskId}`);
}

function resultUrls(result) {
  const raw = result.data?.resultJson;
  if (!raw) return [];
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  return parsed.resultUrls || parsed.urls || parsed.videoUrls || parsed.imageUrls || [];
}

async function download(url, targetWithoutExt) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`);
  const type = res.headers.get("content-type") || "";
  const ext = type.includes("png") ? ".png"
    : type.includes("jpeg") || type.includes("jpg") ? ".jpg"
    : type.includes("webp") ? ".webp"
    : type.includes("mp4") ? ".mp4"
    : extname(new URL(url).pathname) || ".bin";
  const path = `${targetWithoutExt}${ext}`;
  writeFileSync(path, Buffer.from(await res.arrayBuffer()));
  return path;
}
