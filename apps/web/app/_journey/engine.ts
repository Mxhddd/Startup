// @ts-nocheck
// The city journey's engine (pohnch.pk home page, v15): draws the paper map of Karachi on a canvas and
// flies a camera between the scenes of a school day. Everyone starts on the same road (what Pohnch is,
// the 7 am phone call, the van leaving, your door, in the van) and reaches a roundabout: "Interested
// yet?". Three signposts lead down three roads (roads.ts): yes (how it starts, then join), not sure
// (honest answers, our promises, the rest of the day) and drivers (their own story). One scroll,
// swipe or key press = one scene (gesture.ts); every flight plays to the end. The maths (camera.ts),
// the roads (roads.ts), the gesture rules (gesture.ts) and the city (world.ts) are typed and tested;
// this file is the drawing and DOM glue, so type checking is off for it.
import { PILOT_WHATSAPP } from '@pohnch/core';
import { arcFor, camAt as flightCam, clamp, ease, easeIO, flightMs, lerp } from './camera';
import { WheelStepper, swipeStep } from './gesture';
import { ALL_SCENES, FORK, asRoad, pathFor, roadFor, type Road, type SceneId } from './roads';
import { AVE, FORK_AT, H, HOME, HY, ROUTE, ROUTE_LENGTH, VX, W, along, buildings, homeU, parks, trees, vertexU } from './world';

/** Every journey.* word (without the "journey." prefix), in one language. */
export type JourneyCopy = Record<string, string>;
export type JourneyOptions = {
  road?: Road | null;
  onRoad?: (road: Road | null) => void;
  onScene?: (id: SceneId, index: number, total: number) => void;
  onDoubt?: (n: number) => void;
  onRole?: (role: 'parent' | 'driver') => void;
};

/** Starts the journey inside `root` (the element holding the stage, panel, rail). Returns a stop function. */
export function startJourney(root: HTMLElement, copy: JourneyCopy, lang: 'ur' | 'en', opts: JourneyOptions = {}): () => void {
const offs = [];
const on = (target, type, fn, o) => { target.addEventListener(type, fn, o); offs.push(() => target.removeEventListener(type, fn, o)); };
const timers = new Set();
const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };
let raf = 0, stopped = false;
const L = () => copy;
const rtl = lang === 'ur';
const $ = (id) => document.getElementById(id);
const wa = (text) => `https://wa.me/${PILOT_WHATSAPP.waNumber}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

/* ================= scenes ================= */
// Each scene: a camera pose, where the van is on its route (u), the hour (0 dawn, 1 day, 2 golden, 3 night).
const uFork = vertexU(4);
const SC = {
  hero: { cx: 950, cy: 2160, z: 0.8, r: -2, u: 0.0, hr: 0.42, drift: homeU * 0.42 },
  calls: { cx: 880, cy: 2190, z: 1.0, r: 0, u: 0.0, hr: 0.28 },
  left: { cx: 940, cy: 2200, z: 1.05, r: 0, u: homeU * 0.5, hr: 0.55 },
  door: { cx: 1330, cy: 2275, z: 2.35, r: -7, u: homeU, hr: 0.75 },
  van: { cx: 1720, cy: 2160, z: 1.45, r: 4, u: homeU + 0.045, hr: 0.9 },
  fork: { cx: 2500, cy: 1590, ncy: 1320, z: 1.3, r: 0, u: uFork, hr: 0.95 },
  how: { cx: rtl ? 3250 : 2750, cy: 1180, z: 0.9, r: 6, u: 0.86, hr: 1.0 },
  doubts: { cx: 3450, cy: 1900, z: 0.78, r: -4, u: uFork, hr: 1.0 },
  promises: { cx: 3300, cy: 2500, z: 0.62, r: -3, u: 0.72, hr: 1.05 },
  drvCalls: { cx: 260, cy: 2160, z: 1.55, r: 5, u: 0.0, hr: 0.22 },
  drvStart: { cx: 1150, cy: 1450, z: 0.85, r: -4, u: 0.04, hr: 0.45 },
  school: { cx: 3900, cy: 930, z: 1.75, r: 9, u: 1.0, hr: 1.1 },
  home: { cx: 1500, cy: 2230, z: 1.6, r: -5, u: homeU, hr: 1.95 },
  end: { cx: 2400, cy: 1800, z: 0.27, r: 0, u: homeU, hr: 3 },
};
let road = opts.road ?? null, path = pathFor(road);
const idxOf = (id) => path.indexOf(id);

/* ================= colour ================= */
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; };
const DAY = { ground: '#E9DDC6', road: '#F7F1E6', edge: '#CDBC9C', top: ['#E4D5B6', '#D9C6A2', '#ECE0C7'], wall: '#B9A47E', park: '#C3C6A0', tree: '#9DA57A', sea: '#BFCACB', route: '#B8862F', tank: '#C4AE88', shore: '#D6DCDA', dash: '#E6D8BC', parapet: '#CDB993' };
const NIGHT = { ground: '#151B38', road: '#232B52', edge: '#0D1229', top: ['#27315F', '#222B56', '#2C3666'], wall: '#161D40', park: '#1A2A3A', tree: '#1F3040', sea: '#0D1430', route: '#E8A33D', tank: '#343E70', shore: '#1B2550', dash: '#2E3864', parapet: '#1F2850' };

/* ================= canvas ================= */
const cv = $('world'), ctx = cv.getContext('2d');
let vw = 0, vh = 0, dpr = 1, base = 1;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
function toScreen(c, x, y) { const s = base * c.z, dx = (x - c.cx) * s, dy = (y - c.cy) * s, co = Math.cos(c.r), si = Math.sin(c.r); return [vw / 2 + dx * co - dy * si, vh / 2 + dx * si + dy * co]; }
function toWorld(c, sx, sy) { const s = base * c.z, dx = sx - vw / 2, dy = sy - vh / 2, co = Math.cos(-c.r), si = Math.sin(-c.r); return [c.cx + (dx * co - dy * si) / s, c.cy + (dx * si + dy * co) / s]; }
const poseOf = (id) => ({ cx: SC[id].cx, cy: vw < 760 && SC[id].ncy ? SC[id].ncy : SC[id].cy, z: SC[id].z, r: SC[id].r * Math.PI / 180 });
function rr(g, x, y, w, h, r) { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function archP(g, x, y, w, h) { g.moveTo(x, y + h); g.lineTo(x, y + h * 0.42); g.bezierCurveTo(x, y + h * 0.18, x + w * 0.28, y + h * 0.07, x + w / 2, y); g.bezierCurveTo(x + w * 0.72, y + h * 0.07, x + w, y + h * 0.18, x + w, y + h * 0.42); g.lineTo(x + w, y + h); g.closePath(); }
// the outline of a box seen from above: its base rect joined to its top rect, which is shifted by (dx, dy)
function hull(g, x, y, w, h, dx, dy) {
  const P = [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x + dx, y + dy], [x + w + dx, y + dy], [x + w + dx, y + h + dy], [x + dx, y + h + dy]];
  P.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  const pts = lo.slice(0, -1).concat(up.slice(0, -1));
  g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath();
}
// clouds high above the city (world x, y, size)
const CLOUDS = []; { let s2 = 3; const r2 = () => ((s2 = (s2 * 16807) % 2147483647) / 2147483647); for (let k = 0; k < 11; k++) CLOUDS.push([r2() * W, r2() * H, 260 + r2() * 360, r2()]); }
let puffs = []; // dust when the van pulls away
function star(g, x, y, s) { g.save(); g.translate(x, y); g.rotate(Math.PI / 4); g.fillRect(-s / 2, -s / 2, s, s); g.rotate(-Math.PI / 4); g.fillRect(-s / 2, -s / 2, s, s); g.restore(); }
/* ================= one frame of the city ================= */
function draw(c, st, t) {
  const n = clamp(st.hr - 2, 0, 1), gold = Math.max(0, 1 - Math.abs(st.hr - 1.9) / 0.6), dawn = Math.max(0, 0.6 - st.hr) / 0.6 * (1 - st.grey);
  const C = (k, i) => mix(i === undefined ? DAY[k] : DAY[k][i], i === undefined ? NIGHT[k] : NIGHT[k][i], n);
  const s = base * c.z;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = C('ground'); ctx.fillRect(0, 0, vw, vh);
  const o = toScreen(c, 0, 0), co = Math.cos(c.r), si = Math.sin(c.r);
  ctx.setTransform(dpr * s * co, dpr * s * si, -dpr * s * si, dpr * s * co, o[0] * dpr, o[1] * dpr);
  const R = Math.hypot(vw, vh) / s / 2 + 140;
  const inV = (x, y, pad = 0) => Math.abs(x - c.cx) < R + pad && Math.abs(y - c.cy) < R + pad;
  // sea, gently moving shore lines
  ctx.fillStyle = C('sea'); ctx.beginPath(); ctx.moveTo(-400, 3050); ctx.lineTo(1700, 2525); ctx.lineTo(1700, H + 400); ctx.lineTo(-400, H + 400); ctx.fill();
  ctx.strokeStyle = C('shore'); ctx.lineWidth = 3; ctx.beginPath();
  for (let k = 1; k < 7; k++) { const off = reduce ? 0 : Math.sin(t * 0.7 + k * 1.3) * 12; ctx.moveTo(-400, 3050 + k * 64 + off); ctx.lineTo(1700, 2525 + k * 64 + off); }
  ctx.stroke();
  // parks
  ctx.fillStyle = C('park'); ctx.beginPath(); for (const [x, y, w, h] of parks) if (inV(x + w / 2, y + h / 2, w)) ctx.rect(x, y, w, h); ctx.fill();
  // roads
  const roads = (wd, col) => { ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.lineCap = 'round'; ctx.beginPath(); for (const x of VX) { ctx.moveTo(x, -400); ctx.lineTo(x, H + 400); } for (const y of HY) { ctx.moveTo(-400, y); ctx.lineTo(W + 400, y); } ctx.stroke(); ctx.lineWidth = wd * 1.9; ctx.beginPath(); ctx.moveTo(AVE[0][0] - 400, AVE[0][1] + 66); ctx.lineTo(AVE[1][0] + 400, AVE[1][1] - 66); ctx.stroke(); };
  roads(46, C('edge')); roads(36, C('road'));
  ctx.setLineDash([26, 26]); ctx.strokeStyle = C('dash'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(AVE[0][0] - 400, AVE[0][1] + 66); ctx.lineTo(AVE[1][0] + 400, AVE[1][1] - 66); ctx.stroke(); ctx.setLineDash([]);
  // the roundabout where the roads fork: a ring road around a small garden with the Pohnch star
  { const F = FORK_AT; const disc = (r) => { ctx.beginPath(); ctx.arc(F.x, F.y, r, 0, 7); ctx.fill(); };
    ctx.fillStyle = C('edge'); disc(F.r + 23); ctx.fillStyle = C('road'); disc(F.r + 18); ctx.fillStyle = C('park'); disc(F.r - 38);
    ctx.strokeStyle = C('parapet'); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(F.x, F.y, F.r - 38, 0, 7); ctx.stroke();
    ctx.fillStyle = C('tree'); ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; ctx.moveTo(F.x + Math.cos(a) * 64 + 9, F.y + Math.sin(a) * 64); ctx.arc(F.x + Math.cos(a) * 64, F.y + Math.sin(a) * 64, 9, 0, 7); } ctx.fill();
    ctx.fillStyle = mix('#E8A33D', '#F6C46E', n); star(ctx, F.x, F.y, 30); ctx.fillStyle = '#1F2A5C'; ctx.beginPath(); ctx.arc(F.x, F.y, 6, 0, 7); ctx.fill(); }
  // the route in gilt, dashes flowing toward school; glowing at night
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (n > 0.1) { ctx.shadowColor = 'rgba(232,163,61,.7)'; ctx.shadowBlur = 30 * n; }
  ctx.beginPath(); ctx.moveTo(...ROUTE[0]); for (const pt of ROUTE.slice(1)) ctx.lineTo(...pt);
  // before Pohnch the route is only a faint trace; when Pohnch "switches on" the gilt line runs to school
  if (st.lit < 0.995) { ctx.shadowBlur = 0; ctx.strokeStyle = C('edge'); ctx.lineWidth = 6; ctx.setLineDash([2, 16]); ctx.stroke(); ctx.setLineDash([ROUTE_LENGTH * st.lit, ROUTE_LENGTH * 2]); }
  ctx.strokeStyle = C('route'); ctx.lineWidth = 11; if (st.lit > 0.002) ctx.stroke(); ctx.setLineDash([]);
  if (st.lit > 0.98) { ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,246,225,.92)'; ctx.lineWidth = 3; ctx.setLineDash([10, 34]); ctx.lineDashOffset = reduce ? 0 : -t * 60; ctx.stroke(); ctx.setLineDash([]); }
  ctx.restore();
  // trees and their shadows, in two batches
  ctx.fillStyle = `rgba(16,22,47,${0.11 + n * 0.2})`; ctx.beginPath(); for (const [x, y, r] of trees) if (inV(x, y, 40)) { ctx.moveTo(x + r * 1.4, y + r * 0.3); ctx.arc(x + r * 0.4, y + r * 0.3, r, 0, 7); } ctx.fill();
  ctx.fillStyle = C('tree'); ctx.beginPath(); for (const [x, y, r] of trees) if (inV(x, y, 40)) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 7); } ctx.fill();
  // buildings: leaning away from the camera (seen from above), batched by colour
  const alt = 2600 / c.z; // how high the camera is, in world units
  const vis = []; for (const b of buildings) if (inV(b.x + b.w / 2, b.y + b.h / 2, b.w + 80)) vis.push(b);
  const lean = (b) => { const k = (b.z * 1.15) / alt; return [(b.x + b.w / 2 - c.cx) * k, (b.y + b.h / 2 - c.cy) * k]; };
  ctx.fillStyle = `rgba(16,22,47,${0.15 + n * 0.22})`; ctx.beginPath(); for (const b of vis) hull(ctx, b.x, b.y, b.w, b.h, b.z * 0.55, b.z * 0.42); ctx.fill();
  ctx.fillStyle = C('wall'); ctx.beginPath(); for (const b of vis) { const [dx, dy] = lean(b); hull(ctx, b.x, b.y, b.w, b.h, dx, dy); } ctx.fill();
  for (let tone = 0; tone < 3; tone++) { ctx.fillStyle = C('top', tone); ctx.beginPath(); for (const b of vis) if (b.tone === tone) { const [dx, dy] = lean(b); ctx.rect(b.x + dx, b.y + dy, b.w, b.h); } ctx.fill(); }
  if (c.z > 0.5) { // roof details when close: parapet edge, water tanks
    ctx.strokeStyle = C('parapet'); ctx.lineWidth = 3; ctx.beginPath(); for (const b of vis) { const [dx, dy] = lean(b); ctx.rect(b.x + dx + 3, b.y + dy + 3, b.w - 6, b.h - 6); } ctx.stroke();
    ctx.fillStyle = C('tank'); ctx.beginPath(); for (const b of vis) if (b.tank) { const [dx, dy] = lean(b); ctx.rect(b.x + dx + b.w * 0.18, b.y + dy + 10, 18, 14); } ctx.fill();
  }
  // lit windows by night: rippling outward from home
  if (n > 0.01) {
    const reach = n * 5600; ctx.beginPath();
    for (const b of vis) {
      if (b.win < 0.3) continue; const d = Math.hypot(b.x - HOME.x, b.y - HOME.y); if (d > reach) continue;
      const [dx, dy] = lean(b), cols = Math.max(1, Math.floor(b.w / 30));
      for (let k = 0; k < cols; k++) if ((k + Math.floor(b.win * 10)) % 3 !== 0) ctx.rect(b.x + dx + 8 + k * 30, b.y + dy + b.h * 0.3, 10, b.h * 0.22);
    }
    ctx.fillStyle = `rgba(246,196,110,${0.9 * n})`; ctx.fill();
    for (const x of VX) for (let y = 120; y < H; y += 260) {
      if (!inV(x, y, 80)) continue; const d = Math.hypot(x - HOME.x, y - HOME.y); const a = clamp((reach - d - 300) / 500, 0, 1) * (reduce ? 1 : 0.9 + 0.1 * Math.sin(t * 3 + y)); if (a <= 0) continue;
      const g = ctx.createRadialGradient(x + 30, y, 0, x + 30, y, 70); g.addColorStop(0, `rgba(246,196,110,${0.5 * a})`); g.addColorStop(1, 'rgba(246,196,110,0)'); ctx.fillStyle = g; ctx.fillRect(x - 40, y - 70, 140, 140);
    }
  }
  drawHome(n, alt, c); drawSchool(n, gold, t, alt, c);
  drawVan(st, n, gold, t);
  // cloud shadows on the ground
  if (!reduce) { ctx.fillStyle = `rgba(16,22,47,${0.06 * (1 - n)})`; for (const [x0, y, r] of CLOUDS) { const x = ((x0 + t * 18) % (W + 1200)) - 600; if (!inV(x, y, r)) continue; ctx.beginPath(); ctx.ellipse(x + 180, y + 140, r, r * 0.6, 0, 0, 7); ctx.fill(); } }
  // clouds themselves, higher up: they slide faster than the ground (parallax), thinning as we dive
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const ca = clamp(1.25 - c.z, 0, 1) * (1 - n * 0.7);
  if (!reduce && ca > 0.02) {
    for (const [x0, y, r, q] of CLOUDS) {
      const x = ((x0 + t * 18) % (W + 1200)) - 600; const [sx0, sy0] = toScreen(c, x, y); const k = 1.55;
      const sx = vw / 2 + (sx0 - vw / 2) * k, sy = vh / 2 + (sy0 - vh / 2) * k, rr2 = r * s * k;
      if (sx < -rr2 || sx > vw + rr2 || sy < -rr2 || sy > vh + rr2) continue;
      const tint = gold > 0.3 ? '255,214,170' : '255,252,246';
      for (let j = 0; j < 4; j++) { const ox = (j - 1.5) * rr2 * 0.42, oy = Math.sin(j * 2 + q * 6) * rr2 * 0.12; const g = ctx.createRadialGradient(sx + ox, sy + oy, 0, sx + ox, sy + oy, rr2 * 0.55); g.addColorStop(0, `rgba(${tint},${0.42 * ca})`); g.addColorStop(1, `rgba(${tint},0)`); ctx.fillStyle = g; ctx.fillRect(sx + ox - rr2 * 0.55, sy + oy - rr2 * 0.55, rr2 * 1.1, rr2 * 1.1); }
    }
  }
  // birds now and then
  if (!reduce && n < 0.8) { const cyc = (t % 24) / 24; if (cyc < 0.45) { const bx = -60 + cyc / 0.45 * (vw + 120), by = vh * 0.2 + Math.sin(cyc * 9) * 20; ctx.strokeStyle = `rgba(16,22,47,${0.5 * (1 - n)})`; ctx.lineWidth = 1.6; ctx.beginPath(); for (const [ox, oy] of [[0, 0], [18, 8], [-14, 12]]) { const f = Math.sin(t * 9 + ox) * 3; ctx.moveTo(bx + ox - 6, by + oy - f); ctx.quadraticCurveTo(bx + ox - 3, by + oy - 4, bx + ox, by + oy); ctx.quadraticCurveTo(bx + ox + 3, by + oy - 4, bx + ox + 6, by + oy - f); } ctx.stroke(); } }
  // the grey morning before Pohnch: colour drains out of the city, a cool haze over it
  if (st.grey > 0.01) { ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = `rgba(128,128,128,${0.9 * st.grey})`; ctx.fillRect(0, 0, vw, vh); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = `rgba(190,196,208,${0.24 * st.grey})`; ctx.fillRect(0, 0, vw, vh); }
  // the light of the hour
  if (dawn > 0) { const sweep = reduce ? 0.3 : (t * 0.05) % 1; const g = ctx.createLinearGradient(vw * (sweep - 0.5), 0, vw * (sweep + 0.6), vh); g.addColorStop(0, `rgba(242,186,140,${0.32 * dawn})`); g.addColorStop(0.5, `rgba(255,226,180,${0.12 * dawn})`); g.addColorStop(1, `rgba(143,169,214,${0.2 * dawn})`); ctx.fillStyle = g; ctx.fillRect(0, 0, vw, vh); }
  if (gold > 0) { const g = ctx.createLinearGradient(vw, 0, 0, vh); g.addColorStop(0, `rgba(232,150,70,${0.24 * gold})`); g.addColorStop(1, `rgba(120,70,90,${0.13 * gold})`); ctx.fillStyle = g; ctx.fillRect(0, 0, vw, vh); }
  const vg = ctx.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.35, vw / 2, vh / 2, Math.max(vw, vh) * 0.78); vg.addColorStop(0, 'rgba(16,22,47,0)'); vg.addColorStop(1, `rgba(16,22,47,${0.1 + n * 0.35})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, vw, vh);
  return n;
}
function box(n, x, y, w, h, z, alt, c, wall, roof) {
  const k = (z * 1.15) / alt, dx = (x + w / 2 - c.cx) * k, dy = (y + h / 2 - c.cy) * k;
  ctx.fillStyle = `rgba(16,22,47,${0.18 + n * 0.25})`; ctx.beginPath(); hull(ctx, x, y, w, h, z * 0.55, z * 0.42); ctx.fill();
  ctx.fillStyle = wall; ctx.beginPath(); hull(ctx, x, y, w, h, dx, dy); ctx.fill();
  ctx.fillStyle = roof; ctx.fillRect(x + dx, y + dy, w, h);
  return [dx, dy];
}
function drawHome(n, alt, c) {
  const x = HOME.x - 80, y = HOME.y + 40, w = 160, h = 120;
  const [dx, dy] = box(n, x, y, w, h, 60, alt, c, mix('#C8B28A', '#1A2148', n), mix('#F3E9D3', '#2E3A6C', n));
  ctx.strokeStyle = mix('#D9C8A6', '#26305E', n); ctx.lineWidth = 4; ctx.strokeRect(x + dx + 6, y + dy + 6, w - 12, h - 12);
  ctx.fillStyle = mix('#E8A33D', '#F6C46E', n); ctx.beginPath(); archP(ctx, x + w / 2 - 17, y + h - 30, 34, 30); ctx.fill();
  ctx.strokeStyle = '#1F2A5C'; ctx.lineWidth = 3; ctx.beginPath(); archP(ctx, x + w / 2 - 17, y + h - 30, 34, 30); ctx.stroke();
  ctx.fillStyle = '#17705A'; ctx.beginPath(); ctx.arc(HOME.x, HOME.y - 2, 16, 0, 7); ctx.fill(); ctx.strokeStyle = '#F7F1E6'; ctx.lineWidth = 5; ctx.stroke();
}
function drawSchool(n, gold, t, alt, c) {
  const x = 3640, y = 470, w = 620, h = 380;
  const [dx, dy] = box(n, x, y, w, h, 80, alt, c, mix('#C2A97C', '#1A2148', n), mix('#EDE0C3', '#2B3565', n));
  ctx.fillStyle = mix('#D9C59E', '#202955', n); ctx.fillRect(x + dx + 140, y + dy + 50, w - 280, h - 170);
  ctx.fillStyle = mix('#E8A33D', '#F6C46E', Math.max(n, gold)); ctx.beginPath(); for (let k = 0; k < 5; k++) archP(ctx, x + 120 + k * 80, y + h - 40, 40, 36); ctx.fill();
  const fx = x + dx + w / 2, fy = y + dy + 40;
  ctx.strokeStyle = '#1F2A5C'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - 110); ctx.stroke();
  const wave = reduce ? 0 : Math.sin(t * 3) * 6; ctx.fillStyle = '#E8A33D'; ctx.beginPath(); ctx.moveTo(fx, fy - 110); ctx.quadraticCurveTo(fx + 28, fy - 110 + wave, fx + 56, fy - 110); ctx.lineTo(fx + 56, fy - 76); ctx.quadraticCurveTo(fx + 28, fy - 76 + wave, fx, fy - 76); ctx.fill();
}
function drawVan(st, n, gold, t) {
  const v = along(st.u); const ang = v.ang + (st.vdir < 0 ? Math.PI : 0);
  // dust puffs when pulling away
  if (!reduce && st.speed > 0.0004 && Math.random() < 0.5) puffs.push({ x: v.x - Math.cos(ang) * 50, y: v.y - Math.sin(ang) * 50, a: 0.35, r: 10 });
  ctx.fillStyle = mix('#D8C7A6', '#2A3460', n);
  puffs = puffs.filter((p) => (p.a -= 0.012) > 0); for (const p of puffs) { p.r += 0.8; ctx.globalAlpha = p.a; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.save(); ctx.translate(v.x, v.y + (reduce || st.speed > 0 ? 0 : Math.sin(t * 38) * 0.7)); ctx.rotate(ang);
  const lights = Math.max(n, gold * 0.6);
  if (lights > 0.1) { const g = ctx.createRadialGradient(70, 0, 0, 70, 0, 220); g.addColorStop(0, `rgba(255,236,180,${0.55 * lights})`); g.addColorStop(1, 'rgba(255,236,180,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(44, -14); ctx.lineTo(280, -100); ctx.lineTo(280, 100); ctx.lineTo(44, 14); ctx.fill(); }
  ctx.fillStyle = 'rgba(16,22,47,.3)'; ctx.beginPath(); rr(ctx, -40, -14, 92, 46, 12); ctx.fill();
  ctx.fillStyle = '#1F2A5C'; ctx.beginPath(); rr(ctx, -48, -23, 96, 46, 12); ctx.fill(); ctx.strokeStyle = '#F7F1E6'; ctx.lineWidth = 3.5; ctx.stroke();
  ctx.fillStyle = '#CFDCE8'; ctx.beginPath(); rr(ctx, 22, -17, 18, 34, 5); ctx.fill();               // windscreen
  ctx.fillStyle = 'rgba(207,220,232,.55)'; for (const yy of [-21, 17]) for (let k = 0; k < 4; k++) ctx.fillRect(-36 + k * 14, yy, 10, 4); // side windows
  ctx.fillStyle = '#E8A33D'; ctx.fillRect(-40, -3, 56, 6);                                              // kesar stripe
  ctx.fillStyle = '#E8A33D'; star(ctx, -10, 0, 12); ctx.fillStyle = '#1F2A5C'; ctx.beginPath(); ctx.arc(-10, 0, 3, 0, 7); ctx.fill(); // the star
  const brake = st.braking ? 1 : 0.35 + 0.65 * lights;
  ctx.fillStyle = `rgba(240,100,70,${brake})`; ctx.fillRect(-50, -19, 4, 8); ctx.fillRect(-50, 11, 4, 8);
  ctx.restore();
}


/* ================= words pinned to the map ================= */
const pins = $('pins');
const arrow = '<svg width="22" height="12" viewBox="0 0 22 12" aria-hidden="true"><path d="M1 6h19M15 1l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const phoneIcon = '<svg class="ph" width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><path d="M10 4h6l2 7-4 3c2 4 4 6 8 8l3-4 7 2v6c0 2-2 4-4 4C16 30 4 18 4 8c0-2 2-4 4-4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
const missed = '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M3 6l5 5 4-4M12 7h-3M12 7v3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const playIcon = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 2l9 5-9 5z" fill="currentColor"/></svg>';
const split = (s) => s.split(' ').map((w, k) => `<span class="w" style="--k:${k}"><span>${w}</span></span>`).join(' ');
const digits = (s) => `<div class="time" aria-label="${s}">${[...s].map((ch, k) => `<span class="d" style="--k:${k}"><span>${ch}</span></span>`).join('')}</div>`;
const pad = (n) => String(n).padStart(2, '0');
const r = (k, html, tag = 'div', cls = '') => `<${tag} class="r ${cls}" style="--i:${k}"${tag === 'p' || tag === 'span' ? ' aria-hidden="true"' : ''}>${html}</${tag}>`;
function when(id) { const i = idxOf(id); return `<div class="when r" style="--i:0">${i >= 0 ? `<span class="no" dir="ltr">${pad(i + 1)} / ${pad(path.length)}</span>` : ''}<span>${L()[id + '.k']}</span></div>`; }
const head = (id, timed = true) => `${when(id)}${timed ? digits(L()[id + '.t']) : ''}<h2 aria-hidden="true">${split(L()[id + '.h'])}</h2>`;
const stone = (n, text) => `<div class="stone" style="--k:${n}"><span class="mk" aria-hidden="true"><b class="num">${n}</b></span><p>${text}</p></div>`;
const board = (k, f, b, data = '') => `<button class="board" type="button" aria-pressed="false" style="--k:${k}" ${data}><span class="sw"><span class="in"><span class="f"><b>${f}</b><small>POHNCH</small></span><span class="b">${b}</span></span><span class="post"></span></span></button>`;

function wordsHTML(id) {
  const t = L();
  switch (id) {
    case 'hero': return `<div class="words hero"><div class="when r" style="--i:0"><span>${t['hero.k']}</span></div><h1 aria-hidden="true">${split(t['hero.h'])}</h1>${r(4, t['hero.s'], 'p', 'lede')}${r(5, t['hero.f'].split(' · ').map((x) => `<span>${x}</span>`).join(''), 'div', 'facts')}<div class="row r" style="--i:6"><a class="pill" href="#join" data-go="end">${t.cta}</a><button class="go" type="button" data-next>${t['hero.go']}${arrow}</button></div>${r(7, `<button class="play" type="button" id="playB">${playIcon}<span>${t.play}</span></button>`)}</div>`;
    case 'calls': return `<div class="words">${head('calls')}${r(3, t['calls.p'], 'p')}${r(4, t['calls.n'], 'span', 'note after')}</div>`;
    case 'left': return `<div class="words">${head('left')}${r(3, t['left.p'], 'p')}<div class="r try" style="--i:4"><span>${t['left.try']}</span> <button class="go off" type="button" id="offB" aria-pressed="false"><i aria-hidden="true"></i>${t['left.off']}</button><div class="undo" id="offUndo" aria-live="polite"></div></div></div>`;
    case 'door': return `<div class="words">${head('door')}${r(3, t['door.p'], 'p')}<div class="r plat" style="--i:4"><button type="button" data-plat="ios" aria-pressed="true">${t['door.ios']}</button><button type="button" data-plat="android" aria-pressed="false">${t['door.android']}</button></div></div>`;
    case 'van': return `<div class="words">${head('van')}${r(3, t['van.p'], 'p')}<div class="r" style="--i:4"><button class="hold" id="hold" type="button"><span class="fill"></span><span id="holdL">${t.hold}</span><small>${t.holdS}</small></button><div class="undo" id="undo" aria-live="polite"></div></div></div>`;
    case 'fork': return `<div class="words">${head('fork', false)}${r(3, t['fork.p'], 'p')}</div>`;
    case 'how': return `<div class="words">${head('how', false)}${r(3, t['how.p'], 'p')}<div class="row r" style="--i:4"><a class="pill" href="#join" data-go="end">${t.cta}</a></div></div>`;
    case 'doubts': return `<div class="words">${head('doubts', false)}${r(3, t['doubts.p'], 'p')}</div>`;
    case 'promises': return `<div class="words">${head('promises', false)}${r(3, t['promises.p'], 'p', 'opt')}<div class="r ask" style="--i:4"><b>${t['promises.ask']}</b><a class="pill" href="#join" data-go="end">${t['promises.yes']}</a><a class="go" href="${wa(t['promises.waText'])}" rel="noreferrer">${t['promises.no']}${arrow}</a></div></div>`;
    case 'drvCalls': return `<div class="words">${head('drvCalls')}${r(3, t['drvCalls.p'], 'p')}</div>`;
    case 'drvStart': return `<div class="words">${head('drvStart', false)}<div class="row r" style="--i:3"><a class="pill" href="#join" data-go="end" data-role="driver">${t['drvStart.go']}</a><a class="go" href="${wa('')}" rel="noreferrer"><bdi dir="ltr" class="num">${PILOT_WHATSAPP.display}</bdi>${arrow}</a></div></div>`;
    case 'school': return `<div class="words">${head('school')}${r(3, t['school.p'], 'p')}${r(4, t['school.n'], 'span', 'note')}</div>`;
    case 'home': return `<div class="words">${head('home')}${r(3, t['home.p'], 'p')}</div>`;
  }
  return '';
}
// where a scene's words sit on screen ([x, y] as fractions), on a wide screen and on a phone
function spot(id) {
  const side = (f) => (rtl ? 1 - f : f);
  if (vw < 760) return [0.5, { hero: 0.4, calls: 0.73, fork: 0.2, how: 0.25, doubts: 0.21, promises: 0.255, drvCalls: 0.7, drvStart: 0.76 }[id] ?? 0.73];
  return { hero: [side(0.3), 0.5], calls: [0.47, 0.64], left: [side(0.27), 0.56], door: [side(0.26), 0.52], van: [side(0.27), 0.52], fork: [side(0.2), 0.3], how: [side(0.25), 0.36], doubts: [side(0.24), 0.32], promises: [side(0.23), 0.3], drvCalls: [side(0.27), 0.55], drvStart: [side(0.25), 0.36], school: [side(0.28), 0.58], home: [side(0.27), 0.56] }[id];
}
let anchors = [];
function addPin(html, scene, fx, fy, extra = {}) {
  const el = document.createElement('div'); el.className = 'pin'; el.innerHTML = html; pins.appendChild(el);
  const [wx, wy] = toWorld(poseOf(scene), fx * vw, fy * vh);
  anchors.push({ el, scene, wx, wy, ...extra }); return el;
}
function addWorldPin(html, scene, wx, wy, extra = {}) {
  const el = document.createElement('div'); el.className = 'pin'; el.innerHTML = html; pins.appendChild(el);
  anchors.push({ el, scene, wx, wy, ...extra }); return el;
}
function place() {
  if (!vw) return;
  pins.innerHTML = ''; anchors = [];
  const t = L(), narrow = vw < 760, side = (f) => (rtl ? 1 - f : f);
  for (const id of ALL_SCENES) {
    if (id === 'end') continue;
    const [fx, fy] = spot(id); const el = addPin(wordsHTML(id), id, fx, fy, { words: true });
    el.setAttribute('role', 'group'); el.setAttribute('aria-label', t['rail.' + id]);
  }
  // before Pohnch: the parent's missed calls by the house, the driver's phone buzzing by the van
  const times = ['6:49', '6:52', '6:55', '6:57'];
  const log = `<div class="log" aria-hidden="true">${times.map((tm, k) => `<div class="ln" style="--k:${k}">${missed}<b>${t['calls.who']}</b><small>${t['calls.missed']}</small><span class="num">${tm}</span></div>`).join('')}<div class="tally num">×6</div></div>`;
  if (narrow) addPin(log, 'calls', 0.5, 0.3); else addWorldPin(log, 'calls', HOME.x, HOME.y - 150);
  if (!narrow) addWorldPin(`<div class="buzz" aria-hidden="true">${phoneIcon}<b class="num">14</b><span>${t['calls.drv']}</span></div>`, 'calls', ROUTE[0][0] + 40, ROUTE[0][1] - 170);
  // the fork: one signpost, three arms
  const sign = `<div class="sign">${[['yes', 0], ['unsure', 1], ['driver', 2]].map(([rd, k]) => `<button class="arm a${k + 1}" type="button" data-road="${rd}" style="--k:${k}"><b>${t['fork.' + rd]}</b><small>${t['fork.' + rd + '.s']}</small></button>`).join('')}<span class="pole" aria-hidden="true"></span></div>`;
  addWorldPin(sign, 'fork', FORK_AT.x, FORK_AT.y, { oy: narrow ? -118 : -130 });
  // how it starts, and the driver's three steps: milestones rising along the road
  const stones = (id, keys) => keys.forEach((key, k) => {
    const [fx, fy] = narrow ? [0.5, (id === 'how' ? 0.5 : 0.2) + k * 0.14] : [side(0.56 + k * 0.14), 0.7 - k * 0.2];
    addPin(stone(k + 1, t[key]), id, fx, fy);
  });
  stones('how', ['how.1', 'how.2', 'how.3']);
  stones('drvStart', ['drvStart.1', 'drvStart.2', 'drvStart.3']);
  // honest answers (6) and our promises (7): signboards that turn over
  const grid = (n, k, top) => {
    if (narrow) { const fx = 0.27 + (k % 2) * 0.46, fy = top + Math.floor(k / 2) * 0.15; return [n % 2 && k === n - 1 ? 0.5 : fx, fy]; }
    const col = k % 3, row = Math.floor(k / 3); const f2 = 0.52 + col * 0.145; return [rtl ? 1 - f2 : f2, 0.27 + row * 0.25 + (n === 7 && k === 6 ? 0 : 0)];
  };
  [1, 2, 3, 4, 5, 6].forEach((n, k) => {
    const [fx, fy] = grid(6, k, 0.42);
    const el = addPin(board(k, t[`doubts.${n}`], t[`doubts.${n}.b`], `data-doubt="${n}"`), 'doubts', fx, fy, { tilt: (k % 3 - 1) * 2.5 });
    el.querySelector('.board').addEventListener('click', flip);
  });
  [1, 2, 3, 4, 5, 6, 7].forEach((n, k) => {
    let fx, fy;
    if (narrow) { [fx, fy] = grid(7, k, 0.475); fy = 0.475 + Math.floor(k / 2) * 0.118; } else { const col = [0, 1, 2, 0, 1, 2, 1][k], row = [0, 0, 0, 1, 1, 1, 2][k]; const f2 = 0.52 + col * 0.145; fx = rtl ? 1 - f2 : f2; fy = 0.27 + row * 0.25; }
    const el = addPin(board(k, t[`p.${n}`], t[`p.${n}.b`], 'data-p="1"'), 'promises', fx, fy, { tilt: (k % 3 - 1) * 2.5 });
    el.querySelector('.board').addEventListener('click', flip);
  });
  // drivers: the calls a morning, counting down to none
  const cnt = `<div class="count" aria-hidden="true">${phoneIcon}<b class="num" id="cnt">14</b><span>${t['drvCalls.c']}</span></div>`;
  if (narrow) addPin(cnt, 'drvCalls', 0.5, 0.3); else addPin(cnt, 'drvCalls', side(0.78), 0.3);
  wireHold(); wireOff(); syncPlat();
  shown = null; if (introShown && !busy) showWords(cur === 'end' ? null : cur, 1);
}
const doubtsSeen = new Set();
function flip(e) {
  const btn = e.currentTarget; const open = btn.getAttribute('aria-pressed') !== 'true';
  btn.setAttribute('aria-pressed', open ? 'true' : 'false');
  const n = +btn.dataset.doubt; if (open && n && !doubtsSeen.has(n)) { doubtsSeen.add(n); opts.onDoubt?.(n); }
}

/* ================= the phone ================= */
const phoneEl = $('phone');
let tapped = false, undoLeft = 0, undoTimer = 0, phoneKey = '', off = false, offLeft = 0, offTimer = 0, plat = 'ios', lockT0 = 0;
function phoneState(c, st, t, now) {
  const tx = L(); const narrow = vw < 760;
  const want = narrow ? ['left', 'door', 'van'] : ['hero', 'left', 'door', 'van', 'school'];
  const onScreen = want.includes(st.sceneShown);
  const sc = narrow ? Math.min(0.66, (vh * 0.44) / 556) : 1;
  const x = narrow ? vw / 2 - 134 * sc : (rtl ? vw * 0.2 : vw * 0.62), y = narrow ? vh * 0.07 : vh / 2 - 278;
  const key = `${onScreen}|${Math.round(x)}|${Math.round(y)}|${sc}`;
  if (key !== phoneKey) { phoneKey = key; phoneEl.style.transform = `translate3d(${x}px, ${onScreen ? y : vh + 60}px, 0) scale(${sc})`; phoneEl.style.opacity = onScreen ? 1 : 0; }
  phoneEl.style.setProperty('--tilt', `${(rtl ? 3 : -3) + c.r * 57.3 * 0.6}deg`);
  phoneEl.style.setProperty('--bob', `${reduce ? 0 : Math.sin(t * 1.2) * 4}px`);
  const id = st.sceneShown, order = ['hero', 'left', 'door', 'van', 'school'];
  const k = Math.max(0, order.indexOf(id));
  const u = st.u, arrived = k >= 2, inVan = k >= 4 || (k === 3 && tapped), atSchool = k >= 4;
  const mins = Math.max(0, Math.ceil((homeU - Math.min(u, homeU)) / homeU * 6 - 1e-9));
  const eta = $('eta'); const w2 = arrived || off ? '' : String(mins);
  if (eta.textContent !== w2) { eta.textContent = w2; eta.animate([{ transform: 'translateY(12px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: reduce ? 1 : 420, easing: 'cubic-bezier(.2,1.2,.35,1)' }); }
  $('etu').textContent = arrived || off ? '' : tx.unit;
  $('tick').style.strokeDashoffset = inVan ? 0 : 40;
  const title = off && id === 'left' ? tx['left.off'] : atSchool ? tx['school.h'] : inVan ? tx['van.h'] : arrived ? tx['door.h'] : tx['left.h'];
  const pt = $('ptitle'); if (pt.textContent !== title) pt.textContent = title;
  const sub = off && id === 'left' ? tx['left.offDone'] : tx.driver; const ps = $('psub'); if (ps.textContent !== sub) ps.textContent = sub;
  phoneEl.classList.toggle('off', off && id === 'left');
  const push = $('push'), msg = atSchool ? tx['school.h'] : inVan ? tx['van.h'] : arrived && id !== 'door' ? tx['door.h'] : '';
  const pu = $('pusht'), full = msg ? msg + ' · ' + tx.driver.split(' · ')[0] : '';
  if (pu.textContent !== full) { push.classList.remove('on'); if (msg) { pu.textContent = full; later(() => push.classList.add('on'), 450); } }
  const step = atSchool ? 3 : inVan ? 2 : arrived ? 1 : 0;
  document.querySelectorAll('#stones i').forEach((el, j) => { const cls = j < step ? 'd' : j === step ? 'n' : ''; if (el.className !== cls) el.className = cls; });
  $('prd').style.strokeDashoffset = reduce ? 0 : -t * 20;
  const pr = $('pr'), l2 = pr.getTotalLength(), q = pr.getPointAtLength(Math.min(1, Math.min(u, homeU) / homeU * 0.85) * l2);
  $('pvan').setAttribute('transform', `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)}) rotate(-35)`);
  // the lock screen at your door: the Live Activity (iPhone) or ongoing notification (Android) counts down
  const locked = id === 'door'; phoneEl.classList.toggle('locked', locked);
  phoneEl.classList.toggle('android', plat === 'android');
  if (locked) {
    const p = reduce ? 1 : clamp((now - lockT0 - 500) / 3300, 0, 1);
    const left = Math.max(0, 3 - Math.floor(p * 3.3)); const here = p >= 1;
    const s1 = here ? tx['door.here'] : String(left), s2 = here ? '' : tx.unit;
    if ($('laEta').textContent !== s1) { $('laEta').textContent = s1; $('laUnit').textContent = s2; $('islT').textContent = here ? '✓' : `${left}${tx.unit === 'min' ? 'm' : ''}`; }
    const at = here ? tx['door.here'] : tx['door.away']; if ($('andT').textContent !== at) $('andT').textContent = at;
    phoneEl.style.setProperty('--la', (0.25 + 0.75 * p).toFixed(3)); phoneEl.classList.toggle('here', here);
  }
}
function placeHomePin() { const pr = $('pr'); if (!pr) return; const q = pr.getPointAtLength(0.85 * pr.getTotalLength()); $('php').setAttribute('transform', `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)})`); }

/* ================= try it: hold-to-tap, off today, lock screen style ================= */
function wireHold() {
  const btn = $('hold'); if (!btn) return;
  if (tapped) { btn.classList.add('done'); $('holdL').textContent = L().done; }
  let start = 0, raf2 = 0;
  const paint = () => { const h = Math.min(1, (performance.now() - start) / 800); btn.style.setProperty('--h', h); if (h >= 1) { finish(); return; } raf2 = requestAnimationFrame(paint); };
  const begin = (e) => { e.stopPropagation(); stopPlay(); if (tapped) return; if (e.pointerId !== undefined) { try { btn.setPointerCapture(e.pointerId); } catch (_) {} } start = performance.now(); raf2 = requestAnimationFrame(paint); };
  const end = () => { cancelAnimationFrame(raf2); if (!tapped) btn.style.setProperty('--h', 0); };
  const finish = () => { cancelAnimationFrame(raf2); tapped = true; btn.classList.add('done'); $('holdL').textContent = L().done; undoLeft = 5; tickUndo(); };
  btn.addEventListener('pointerdown', begin); btn.addEventListener('pointerup', end); btn.addEventListener('pointercancel', end); btn.addEventListener('pointerleave', end);
  btn.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); e.stopPropagation(); begin(e); } });
  btn.addEventListener('keyup', end); btn.addEventListener('contextmenu', (e) => e.preventDefault());
  btn.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
}
function tickUndo() {
  const box2 = $('undo'); if (!box2) return; clearTimeout(undoTimer);
  if (undoLeft <= 0) { box2.innerHTML = ''; return; }
  box2.innerHTML = `<span class="num">${undoLeft}</span><button type="button" id="undoB">${L().undo}</button>`;
  $('undoB').onclick = () => { tapped = false; undoLeft = 0; clearTimeout(undoTimer); const btn = $('hold'); btn.classList.remove('done'); btn.style.setProperty('--h', 0); $('holdL').textContent = L().hold; box2.textContent = L().undone; };
  undoTimer = setTimeout(() => { undoLeft--; tickUndo(); }, 1000);
}
function wireOff() {
  const btn = $('offB'); if (!btn) return;
  btn.setAttribute('aria-pressed', off ? 'true' : 'false');
  btn.onclick = (e) => { e.stopPropagation(); stopPlay(); if (off) return; off = true; btn.setAttribute('aria-pressed', 'true'); offLeft = 5; tickOff(); };
}
function tickOff() {
  const box2 = $('offUndo'); if (!box2) return; clearTimeout(offTimer);
  if (offLeft <= 0) { box2.innerHTML = ''; return; }
  box2.innerHTML = `<span class="num">${offLeft}</span><button type="button" id="offUndoB">${L().undo}</button>`;
  $('offUndoB').onclick = () => { off = false; offLeft = 0; clearTimeout(offTimer); $('offB')?.setAttribute('aria-pressed', 'false'); box2.textContent = L().undone; };
  offTimer = setTimeout(() => { offLeft--; tickOff(); }, 1000);
}
function syncPlat() { document.querySelectorAll('[data-plat]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.plat === plat ? 'true' : 'false')); }

/* ================= words in and out, and what each scene does when it lands ================= */
let shown = null, callsOn = false, cntTimer = 0;
function showWords(id, dir) {
  if (id === shown) return;
  anchors.forEach((a) => {
    a.el.style.setProperty('--dir', dir);
    if (a.scene === id) { a.el.classList.remove('leaving'); a.el.classList.add('on'); }
    else if (a.el.classList.contains('on')) { a.el.classList.remove('on'); a.el.classList.add('leaving'); later(() => a.el.classList.remove('leaving'), 650); }
  });
  shown = id;
  if (id) landed(id);
}
function landed(id) {
  if (id === 'calls') later(() => { if (shown !== 'calls') return; callsOn = true; anchors.forEach((a) => a.scene === 'calls' && a.el.classList.add('switched')); }, reduce ? 400 : 2300);
  if (id === 'door') lockT0 = performance.now();
  if (id === 'drvCalls') {
    let n = 14; const el = $('cnt'); if (el) el.textContent = '14'; clearInterval(cntTimer);
    anchors.forEach((a) => a.scene === 'drvCalls' && a.el.classList.remove('calm'));
    later(() => { cntTimer = setInterval(() => { n--; const e2 = $('cnt'); if (e2) e2.textContent = String(n); if (n <= 0) { clearInterval(cntTimer); anchors.forEach((a) => a.scene === 'drvCalls' && a.el.classList.add('calm')); } }, reduce ? 10 : 120); }, reduce ? 0 : 900);
  }
}
function leftScene(id) {
  if (id === 'calls') { callsOn = false; anchors.forEach((a) => a.scene === 'calls' && a.el.classList.remove('switched')); }
}

/* ================= the step engine: one gesture = one scene ================= */
let introShown = false;
let cur = 'hero', busy = false, queued = 0, fl = null, introT0 = performance.now(), moved = false, heroT0 = performance.now();
let st = { cam: poseOf('hero'), u: 0, hr: SC.hero.hr, vdir: 1, speed: 0, braking: false, sceneShown: 'hero', grey: 0, lit: 1 };
const stage = $('stage'), panel = $('panel'), rail = $('rail');
const reading = () => root.classList.contains('reading');
function goTo(target, o = {}) {
  if (!SC[target] || target === cur) return;
  if (busy) return;
  if (!moved) { moved = true; $('next').classList.add('hide'); }
  const from = cur, A = poseOf(from), B = poseOf(target);
  const dir = (idxOf(target) >= idxOf(from)) ? 1 : -1;
  cur = target; busy = true; stage.classList.add('flying');
  showWords(null, dir); leftScene(from);
  if (from === 'end') panel.classList.remove('up');
  const dist = Math.hypot(B.cx - A.cx, B.cy - A.cy) * base * Math.min(A.z, B.z) / Math.max(vw, vh);
  const arc = reduce ? 0 : arcFor(dist);
  const dur = reduce ? 520 : flightMs(arc, !!o.long);
  const uA = from === 'hero' ? st.u : SC[from].u;
  fl = { from, to: target, A, B, arc, t0: performance.now() + (reduce ? 0 : 160), dur, dir, uA, uB: SC[target].u, hA: SC[from].hr, hB: SC[target].hr, wordsAt: reduce ? 0.6 : 0.74 };
  if (reduce) { cv.style.opacity = 0.2; later(() => { cv.style.opacity = 1; }, 240); }
  syncRail();
}
function step(d) {
  if (busy) { queued = clamp(d, -1, 1); return; }
  let i = idxOf(cur); if (i < 0) i = FORK;
  const j = clamp(i + d, 0, path.length - 1); if (path[j] !== cur) goTo(path[j]);
}
function setRoad(rd) {
  if (rd === road) return;
  road = rd; path = pathFor(road); buildRail(); place(); opts.onRoad?.(road);
}
function choose(rd) { setRoad(rd); goTo(path[FORK + 1]); }
function jumpTo(id, o = {}) {
  if (busy || id === cur) return;
  const rd = roadFor(id, road); if (rd !== road) setRoad(rd);
  goTo(id, { long: Math.abs(idxOf(id) - idxOf(cur)) > 1 || idxOf(cur) < 0, ...o });
}
function camAt(f, k) { return flightCam(f.A, f.B, f.arc, f.dir, k, !reduce); }

/* ================= play the day ================= */
let playing = false, playTimer = 0;
const DWELL = { calls: 5600, door: 5200, van: 4600, fork: 4200 };
function play() { playing = true; root.classList.add('playing'); if (!busy) { if (cur === 'end') jumpTo('hero'); else step(1); } }
function stopPlay() { if (!playing) return; playing = false; clearTimeout(playTimer); root.classList.remove('playing'); }
function playOn() { clearTimeout(playTimer); if (!playing) return; if (cur === 'end') { stopPlay(); return; } playTimer = later(() => { if (playing && !busy) step(1); }, reduce ? 4000 : DWELL[cur] ?? 4300); }

/* ================= input ================= */
const stepper = new WheelStepper();
const el = (e) => (e.target instanceof Element ? e.target : document.body);
const inPanel = (e) => panel.contains(el(e));
const inMenu = (e) => !!el(e).closest('.menu');
on(window, 'wheel', (e) => {
  if (reading() || inMenu(e)) return;
  if (cur === 'end' && !busy && inPanel(e) && (e.deltaY > 0 || panel.scrollTop > 0)) return; // the panel scrolls itself
  e.preventDefault(); stopPlay();
  const s = stepper.push(e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY, performance.now());
  if (s) step(s);
}, { passive: false });
let tY = null, tX = null;
on(window, 'touchstart', (e) => { if (reading() || inMenu(e)) { tY = null; return; } tY = e.touches[0].clientY; tX = e.touches[0].clientX; }, { passive: true });
on(window, 'touchmove', (e) => { if (tY === null) return; const dy = tY - e.touches[0].clientY; if (cur === 'end' && !busy && inPanel(e) && (dy > 0 || panel.scrollTop > 0)) { tY = null; return; } e.preventDefault(); }, { passive: false });
on(window, 'touchend', (e) => { if (tY === null) return; const tch = e.changedTouches[0], s = swipeStep(tY - tch.clientY, tX - tch.clientX); tY = null; if (s) { stopPlay(); step(s); } });
on(window, 'keydown', (e) => {
  if (reading() || el(e).closest('input,textarea,select,.menu')) return;
  if (cur === 'end' && inPanel(e) && panel.scrollTop > 0) return;
  if (['ArrowDown', 'PageDown'].includes(e.key) || (e.key === ' ' && !el(e).closest('button,a,summary'))) { e.preventDefault(); stopPlay(); step(1); }
  if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); stopPlay(); step(-1); }
  if (e.key === 'Home') { e.preventDefault(); stopPlay(); jumpTo('hero'); } if (e.key === 'End') { e.preventDefault(); stopPlay(); jumpTo('end'); }
});
on(document, 'click', (e) => {
  const t = e.target instanceof Element ? e.target : null; if (!t) return;
  if (t.closest('#playB')) { e.preventDefault(); play(); return; }
  if (t.closest('[data-pause]')) { e.preventDefault(); stopPlay(); return; }
  if (!t.closest('.playbar')) stopPlay();
  const rd = t.closest('[data-road]'); if (rd) { e.preventDefault(); const r2 = asRoad(rd.dataset.road); if (r2 && !busy) choose(r2); return; }
  const pl = t.closest('[data-plat]'); if (pl) { plat = pl.dataset.plat; syncPlat(); lockT0 = performance.now(); return; }
  if (t.closest('[data-next]')) { e.preventDefault(); step(1); return; }
  const g = t.closest('[data-go]'); if (g) {
    e.preventDefault(); if (reading()) return;
    if (g.dataset.role) opts.onRole?.(g.dataset.role);
    const target = g.dataset.go, anchor = g.dataset.anchor;
    if (target === cur && cur === 'end') { if (anchor) $(anchor)?.scrollIntoView({ behavior: 'smooth' }); else panel.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    jumpTo(target);
    if (anchor) later(() => $(anchor)?.scrollIntoView({ behavior: 'smooth' }), reduce ? 700 : 2200);
    else if (target === 'end') panel.scrollTop = 0;
  }
});

/* ================= the frame loop ================= */
let tPrev = performance.now(), hidden = false, mx = 0, my = 0, pmx = 0, pmy = 0;
on(window, 'pointermove', (e) => { if (e.pointerType === 'mouse') { mx = e.clientX / vw - 0.5; my = e.clientY / vh - 0.5; } }, { passive: true });
on(document, 'visibilitychange', () => { hidden = document.hidden; if (!hidden && !stopped) { tPrev = performance.now(); raf = requestAnimationFrame(frame); } });
const greyOf = (id) => (id === 'calls' && !callsOn ? 1 : 0);
function frame(now) {
  if (hidden || stopped) return;
  if (reading()) { tPrev = now; raf = requestAnimationFrame(frame); return; }
  const dt = Math.min(0.05, (now - tPrev) / 1000); tPrev = now; const t = now / 1000;
  let c, uPrev = st.u, greyT;
  if (fl) {
    const k = clamp((now - fl.t0) / fl.dur, 0, 1);
    c = camAt(fl, k); const ek = ease(clamp(k * 1.08, 0, 1));
    st.u = lerp(fl.uA, fl.uB, ek); st.hr = lerp(fl.hA, fl.hB, easeIO(k)); st.vdir = fl.uB >= fl.uA ? 1 : -1;
    st.braking = k > 0.75 && k < 1 && Math.abs(fl.uB - fl.uA) > 0.001;
    greyT = lerp(greyOf(fl.from), greyOf(fl.to), easeIO(k));
    if (k >= fl.wordsAt && shown !== fl.to) { if (fl.to !== 'end') showWords(fl.to, fl.dir); st.sceneShown = fl.to; }
    if (fl.to === 'end' && k > 0.55) panel.classList.add('up');
    if (k >= 1) {
      busy = false; const done = fl.to; fl = null; stage.classList.remove('flying'); st.sceneShown = cur;
      if (done === 'hero') heroT0 = now;
      opts.onScene?.(cur, idxOf(cur), path.length);
      if (queued) { const q = queued; queued = 0; step(q); } else playOn();
    }
  } else {
    c = poseOf(cur); greyT = greyOf(cur);
    if (cur === 'hero') { const k = reduce ? 1 : clamp((now - heroT0) / 16000, 0, 1); st.u = lerp(SC.hero.u, SC.hero.drift, easeIO(k)); }
  }
  st.grey += (greyT - st.grey) * Math.min(1, dt * 3);
  const litT = 1 - greyT; st.lit = litT > st.lit ? Math.min(litT, st.lit + dt / 1.6) : st.lit + (litT - st.lit) * Math.min(1, dt * 4);
  st.speed = Math.abs(st.u - uPrev) / Math.max(dt, 0.001) * dt; st.cam = c;
  // intro: the camera drifts down from high above while the paper veil lifts
  const ki = reduce ? 1 : clamp((now - introT0) / 2600, 0, 1);
  if (ki < 1) { const e = ease(ki); c = { ...c, z: c.z * (0.42 + 0.58 * e), r: c.r - (1 - e) * 0.14 }; }
  if (ki > 0.3 && shown === null && !busy && !fl && !introShown) { introShown = true; heroT0 = now; showWords(cur === 'end' ? null : cur, 1); opts.onScene?.(cur, idxOf(cur), path.length); }
  // the camera breathes, and leans a little toward the mouse
  if (!reduce) { pmx += (mx - pmx) * 0.05; pmy += (my - pmy) * 0.05; c = { ...c, cx: c.cx + (Math.sin(t * 0.27) * 8 + pmx * 60) / c.z, cy: c.cy + (Math.cos(t * 0.21) * 6 + pmy * 40) / c.z, z: c.z * (1 + Math.sin(t * 0.33) * 0.004) }; }
  const n = draw(c, st, t);
  const night = n > 0.5 || panel.classList.contains('up'); root.classList.toggle('night', night);
  const rs = root.style;
  rs.setProperty('--fg', night ? '#F5EEE1' : '#10162F'); rs.setProperty('--fg2', night ? 'rgba(245,238,225,.8)' : '#6E6450'); rs.setProperty('--mist', night ? '16,22,47' : '245,238,225'); rs.setProperty('--paper', night ? '#10162F' : '#F5EEE1');
  for (const a of anchors) {
    if (!a.el.classList.contains('on') && !a.el.classList.contains('leaving')) continue;
    const [sx, sy] = toScreen(c, a.wx, a.wy), ew = a.el.offsetWidth, eh = a.el.offsetHeight;
    a.el.style.transform = `translate3d(${(sx - ew / 2 + (a.ox || 0)).toFixed(1)}px, ${(sy - eh / 2 + (a.oy || 0)).toFixed(1)}px, 0) rotate(${((a.tilt || 0) + c.r * 57.3 * 0.4).toFixed(2)}deg)`;
  }
  phoneState(c, st, t, now);
  const i0 = fl ? idxOf(fl.from) : idxOf(cur), i1 = idxOf(cur);
  const prog = fl && i0 >= 0 ? lerp(i0, i1, easeIO(clamp((now - fl.t0) / fl.dur, 0, 1))) : i1;
  $('progI').style.setProperty('--p', (Math.max(0, prog) / (path.length - 1)).toFixed(4));
  raf = requestAnimationFrame(frame);
}

/* ================= rail and start ================= */
function buildRail() {
  rail.innerHTML = path.map((id) => `<button type="button" data-id="${id}" aria-label="${L()['rail.' + id]}"><span>${L()['rail.' + id]}</span></button>`).join('');
  [...rail.children].forEach((b) => b.addEventListener('click', () => { stopPlay(); jumpTo(b.dataset.id); }));
  syncRail();
}
function syncRail() { [...rail.children].forEach((b) => b.classList.toggle('on', b.dataset.id === cur)); }
function size() { dpr = Math.min(2, window.devicePixelRatio || 1); vw = innerWidth; vh = innerHeight; cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr); base = vw / (vw < 760 ? 950 : 1500); phoneKey = ''; place(); }
$('next').addEventListener('click', () => step(1));
on(window, 'resize', size);
document.documentElement.classList.add('jr-lock');
buildRail(); placeHomePin(); size();
const veilT = setTimeout(() => $('veil').classList.add('gone'), 60);
if (document.fonts) document.fonts.ready.then(() => { if (!stopped) place(); });
raf = requestAnimationFrame(frame);
window.__journey = {
  next: () => step(1), prev: () => step(-1), goTo: jumpTo, choose, play, stop: stopPlay,
  get id() { return cur; }, get index() { return idxOf(cur); }, get total() { return path.length; }, get road() { return road; },
  get busy() { return busy; }, get shown() { return shown; }, get playing() { return playing; },
};
return () => {
  stopped = true; cancelAnimationFrame(raf); clearTimeout(veilT); clearTimeout(undoTimer); clearTimeout(offTimer); clearInterval(cntTimer);
  timers.forEach((id) => clearTimeout(id)); offs.forEach((f) => f()); document.documentElement.classList.remove('jr-lock'); delete window.__journey;
};
}
