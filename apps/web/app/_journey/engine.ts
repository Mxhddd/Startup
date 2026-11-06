// @ts-nocheck
// The city journey's engine (pohnch.pk home page): draws the paper map of Karachi on a canvas,
// flies a camera between seven scenes of a school day, and sets the words, the phone and the
// signboards for each. One scroll, swipe or key press = one scene (see gesture.ts); every flight
// plays to the end. The maths (camera.ts), the gesture rules (gesture.ts) and the city (world.ts)
// are typed and tested; this file is the drawing and DOM glue, ported from the design prototype, so
// type checking is off for it.
import { arcFor, camAt as flightCam, clamp, ease, easeIO, flightMs, lerp } from './camera';
import { WheelStepper, swipeStep } from './gesture';
import { AVE, H, HOME, HY, ROUTE, VX, W, along, buildings, homeU, parks, trees } from './world';

export type JourneyCopy = Record<string, string> & { p: [string, string][]; rail: string[] };

/** Starts the journey inside `root` (the element holding the stage, panel, rail). Returns a stop function. */
export function startJourney(root: HTMLElement, copy: JourneyCopy, lang: 'ur' | 'en'): () => void {
const offs = [];
const on = (target, type, fn, opt) => { target.addEventListener(type, fn, opt); offs.push(() => target.removeEventListener(type, fn, opt)); };
let raf = 0, stopped = false;
const L = () => copy;
/* ================= scenes ================= */
// Each scene is a camera pose, where the van is on its route, and the hour (0 dawn, 1 day, 2 golden, 3 night).
const SCENES = [
  { cx: 2350, cy: 1850, z: 0.30, r: 0, u: 0.0, hr: 0.15 },          // 0 dawn over Karachi
  { cx: 940, cy: 2200, z: 1.05, r: 0, u: homeU * 0.5, hr: 0.55 },     // 1 7:02 the van left
  { cx: 1330, cy: 2275, z: 2.35, r: -7, u: homeU, hr: 0.75 },         // 2 7:09 your door
  { cx: 1720, cy: 2160, z: 1.45, r: 4, u: homeU + 0.045, hr: 0.9 },   // 3 7:12 in the van
  { cx: 2350, cy: 1500, z: 0.62, r: -3, u: 0.6, hr: 1.0 },            // 4 promises over the rooftops
  { cx: 3900, cy: 930, z: 1.75, r: 9, u: 1.0, hr: 1.1 },              // 5 7:41 school
  { cx: 1500, cy: 2230, z: 1.6, r: -5, u: homeU, hr: 1.95 },          // 6 2:05 home, drivers
  { cx: 2400, cy: 1800, z: 0.27, r: 0, u: homeU, hr: 3 },             // 7 night falls, the panel rises
];
const LAST = SCENES.length - 1;

/* ================= colour ================= */
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; };
const DAY = { ground: '#E9DDC6', road: '#F7F1E6', edge: '#CDBC9C', top: ['#E4D5B6', '#D9C6A2', '#ECE0C7'], wall: '#B9A47E', park: '#C3C6A0', tree: '#9DA57A', sea: '#BFCACB', route: '#B8862F', tank: '#C4AE88', shore: '#D6DCDA', dash: '#E6D8BC', parapet: '#CDB993' };
const NIGHT = { ground: '#151B38', road: '#232B52', edge: '#0D1229', top: ['#27315F', '#222B56', '#2C3666'], wall: '#161D40', park: '#1A2A3A', tree: '#1F3040', sea: '#0D1430', route: '#E8A33D', tank: '#343E70', shore: '#1B2550', dash: '#2E3864', parapet: '#1F2850' };

/* ================= canvas ================= */
const cv = document.getElementById('world'), ctx = cv.getContext('2d');
let vw = 0, vh = 0, dpr = 1, base = 1;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
function toScreen(c, x, y) { const s = base * c.z, dx = (x - c.cx) * s, dy = (y - c.cy) * s, co = Math.cos(c.r), si = Math.sin(c.r); return [vw / 2 + dx * co - dy * si, vh / 2 + dx * si + dy * co]; }
function toWorld(c, sx, sy) { const s = base * c.z, dx = sx - vw / 2, dy = sy - vh / 2, co = Math.cos(-c.r), si = Math.sin(-c.r); return [c.cx + (dx * co - dy * si) / s, c.cy + (dx * si + dy * co) / s]; }
const poseOf = (i) => ({ cx: SCENES[i].cx, cy: SCENES[i].cy, z: SCENES[i].z, r: SCENES[i].r * Math.PI / 180 });
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

/* ================= one frame of the city ================= */
function draw(c, st, t) {
  const n = clamp(st.hr - 2, 0, 1), gold = Math.max(0, 1 - Math.abs(st.hr - 1.9) / 0.6), dawn = Math.max(0, 0.6 - st.hr) / 0.6;
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
  // the route in gilt, dashes flowing toward school; glowing at night
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (n > 0.1) { ctx.shadowColor = 'rgba(232,163,61,.7)'; ctx.shadowBlur = 30 * n; }
  ctx.strokeStyle = C('route'); ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(...ROUTE[0]); for (const pt of ROUTE.slice(1)) ctx.lineTo(...pt); ctx.stroke();
  ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,246,225,.92)'; ctx.lineWidth = 3; ctx.setLineDash([10, 34]); ctx.lineDashOffset = reduce ? 0 : -t * 60; ctx.stroke(); ctx.setLineDash([]); ctx.restore();
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
  ctx.save(); ctx.translate(-10, 0); ctx.rotate(Math.PI / 4); ctx.fillStyle = '#E8A33D'; ctx.fillRect(-6, -6, 12, 12); ctx.rotate(-Math.PI / 4); ctx.fillRect(-6, -6, 12, 12); ctx.fillStyle = '#1F2A5C'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, 7); ctx.fill(); ctx.restore(); // the star
  const brake = st.braking ? 1 : 0.35 + 0.65 * lights;
  ctx.fillStyle = `rgba(240,100,70,${brake})`; ctx.fillRect(-50, -19, 4, 8); ctx.fillRect(-50, 11, 4, 8);
  ctx.restore();
}

/* ================= words pinned to the map ================= */
const pins = document.getElementById('pins');
const arrow = '<svg width="22" height="12" viewBox="0 0 22 12" aria-hidden="true"><path d="M1 6h19M15 1l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const split = (s) => s.split(' ').map((w, k) => `<span class="w" style="--k:${k}"><span>${w}</span></span>`).join(' ');
const digits = (s) => `<div class="time" aria-label="${s}">${[...s].map((ch, k) => `<span class="d" style="--k:${k}"><span>${ch}</span></span>`).join('')}</div>`;
let anchors = [];
function stopHTML(i) {
  const t = L(); const r = (k, html, tag = 'div', cls = '') => `<${tag} class="r ${cls}" style="--i:${k}"${tag === 'p' || tag === 'span' ? ' aria-hidden="true"' : ''}>${html}</${tag}>`;
  const when = (k) => `<div class="when r" style="--i:0"><span class="no" dir="ltr">0${i + 1} / 07</span><span>${t[k]}</span></div>`;
  switch (i) {
    case 0: return `<div class="words hero">${when('s0k')}<h1 aria-hidden="true">${split(t.s0h)}</h1><div class="sub r" style="--i:4">${t.s0s}</div>${r(5, t.s0p, 'p')}<div class="row r" style="--i:6"><a class="pill" href="#" data-stop="7">${t.cta}</a><button class="go" type="button" data-stop="1">${t.s0go}${arrow}</button></div></div>`;
    case 1: return `<div class="words">${when('s1k')}${digits(t.s1t)}<h2 aria-hidden="true">${split(t.s1h)}</h2>${r(3, t.s1p, 'p')}${r(4, t.s1n, 'span', 'note')}</div>`;
    case 2: return `<div class="words">${when('s2k')}${digits(t.s2t)}<h2 aria-hidden="true">${split(t.s2h)}</h2>${r(3, t.s2p, 'p')}</div>`;
    case 3: return `<div class="words">${when('s3k')}${digits(t.s3t)}<h2 aria-hidden="true">${split(t.s3h)}</h2>${r(3, t.s3p, 'p')}<div class="r" style="--i:4"><button class="hold" id="hold" type="button"><span class="fill"></span><span id="holdL">${t.hold}</span><small>${t.holdS}</small></button><div class="undo" id="undo" aria-live="polite"></div></div></div>`;
    case 4: return `<div class="words">${when('s4k')}<h2 aria-hidden="true">${split(t.s4h)}</h2>${r(3, t.s4p, 'p')}</div>`;
    case 5: return `<div class="words">${when('s5k')}${digits(t.s5t)}<h2 aria-hidden="true">${split(t.s5h)}</h2>${r(3, t.s5p, 'p')}${r(4, t.s5n, 'span', 'note')}</div>`;
    case 6: return `<div class="words">${when('s6k')}${digits(t.s6t)}<h2 aria-hidden="true">${split(t.s6h)}</h2>${r(3, t.s6p, 'p')}<div class="r" style="--i:4;margin-top:18px"><a class="go" href="#drivers">${t.s6go}${arrow}</a></div></div>`;
  }
}
function spot(i) {
  const phone = vw < 760, rtl = lang === 'ur', side = (f) => (rtl ? 1 - f : f);
  if (phone) return [0.5, i === 0 ? 0.42 : i === 4 ? 0.2 : 0.72];
  return [[side(0.3), 0.5], [side(0.27), 0.56], [side(0.26), 0.52], [side(0.27), 0.52], [side(0.25), 0.3], [side(0.28), 0.58], [side(0.27), 0.52]][i];
}
function addPin(html, scene, fx, fy, extra = {}) {
  const el = document.createElement('div'); el.className = 'pin'; el.innerHTML = html; pins.appendChild(el);
  const [wx, wy] = toWorld(poseOf(scene), fx * vw, fy * vh);
  anchors.push({ el, scene, wx, wy, ...extra }); return el;
}
function place() {
  if (!vw) return;
  pins.innerHTML = ''; anchors = [];
  for (let i = 0; i < 7; i++) { const [fx, fy] = spot(i); const el = addPin(stopHTML(i), i, fx, fy); el.setAttribute('role', 'group'); el.setAttribute('aria-label', copy.rail[i]); }
  const phone = vw < 760, rtl = lang === 'ur';
  L().p.forEach(([f, b], k) => {
    let fx, fy;
    if (phone) { fx = 0.27 + (k % 2) * 0.46; fy = 0.42 + Math.floor(k / 2) * 0.15; if (k === 6) fx = 0.5; }
    else { const col = [0, 1, 2, 0, 1, 2, 1][k], row = [0, 0, 0, 1, 1, 1, 2][k]; const f2 = 0.56 + col * 0.15; fx = rtl ? 1 - f2 : f2; fy = 0.27 + row * 0.25; }
    const el = addPin(`<button class="board" type="button" aria-pressed="false" style="--k:${k}"><span class="sw"><span class="in"><span class="f"><b>${f}</b><small>POHNCH</small></span><span class="b">${b}</span></span><span class="post"></span></span></button>`, 4, fx, fy, { tilt: (k % 3 - 1) * 2.5 });
    el.querySelector('.board').addEventListener('click', (e) => { const btn = e.currentTarget; btn.setAttribute('aria-pressed', btn.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); });
  });
  wireHold(); shown = -1; if (introShown && !busy) showWords(scene < LAST ? scene : -1, 1);
}

/* ================= the phone ================= */
const phoneEl = document.getElementById('phone');
let tapped = false, undoLeft = 0, undoTimer = 0, phoneKey = '';
function phoneState(c, st, t) {
  const tx = L(); const narrow = vw < 760, rtl = lang === 'ur';
  const want = narrow ? [2, 3] : [2, 3, 5];
  const on = want.includes(st.sceneShown);
  const sc = narrow ? Math.min(0.66, (vh * 0.44) / 556) : 1;
  const x = narrow ? vw / 2 - 134 * sc : (rtl ? vw * 0.2 : vw * 0.62), y = narrow ? vh * 0.07 : vh / 2 - 278;
  const key = `${on}|${Math.round(x)}|${Math.round(y)}|${sc}`;
  if (key !== phoneKey) { phoneKey = key; phoneEl.style.transform = `translate3d(${x}px, ${on ? y : vh + 60}px, 0) scale(${sc})`; phoneEl.style.opacity = on ? 1 : 0; }
  phoneEl.style.setProperty('--tilt', `${(rtl ? 3 : -3) + c.r * 57.3 * 0.6}deg`);
  phoneEl.style.setProperty('--bob', `${reduce ? 0 : Math.sin(t * 1.2) * 4}px`);
  const u = st.u, arrived = u >= homeU - 0.001 || st.sceneShown >= 2, inVan = tapped || st.sceneShown >= 4 || (st.sceneShown === 3 && tapped), atSchool = st.sceneShown >= 5;
  const mins = Math.max(0, Math.ceil((homeU - Math.min(u, homeU)) / homeU * 6 - 1e-9));
  const eta = document.getElementById('eta'); const w2 = arrived ? '' : String(mins);
  if (eta.textContent !== w2) { eta.textContent = w2; eta.animate([{ transform: 'translateY(12px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: reduce ? 1 : 420, easing: 'cubic-bezier(.2,1.2,.35,1)' }); }
  document.getElementById('etu').textContent = arrived ? '' : tx.unit;
  document.getElementById('tick').style.strokeDashoffset = inVan ? 0 : 40;
  const title = atSchool ? tx.s5h : inVan ? tx.s3h : arrived ? tx.s2h : tx.s1h; const pt = document.getElementById('ptitle'); if (pt.textContent !== title) pt.textContent = title;
  const push = document.getElementById('push'), msg = atSchool ? tx.s5h : inVan ? tx.s3h : arrived ? tx.s2h : '';
  const pu = document.getElementById('pusht'), full = msg ? msg + ' · ' + tx.driver.split(' · ')[0] : '';
  if (pu.textContent !== full) { push.classList.remove('on'); if (msg) { pu.textContent = full; setTimeout(() => push.classList.add('on'), 450); } }
  const step = atSchool ? 3 : inVan ? 2 : arrived ? 1 : 0;
  document.querySelectorAll('#stones i').forEach((el, k) => { const cls = k < step ? 'd' : k === step ? 'n' : ''; if (el.className !== cls) el.className = cls; });
  document.getElementById('prd').style.strokeDashoffset = reduce ? 0 : -t * 20;
  const pr = document.getElementById('pr'), l2 = pr.getTotalLength(), q = pr.getPointAtLength(Math.min(1, Math.min(u, homeU) / homeU * 0.85) * l2);
  document.getElementById('pvan').setAttribute('transform', `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)}) rotate(-35)`);
}

/* ================= hold-to-tap ================= */
function wireHold() {
  const btn = document.getElementById('hold'); if (!btn) return;
  if (tapped) { btn.classList.add('done'); document.getElementById('holdL').textContent = L().done; }
  let start = 0, raf = 0;
  const paint = () => { const h = Math.min(1, (performance.now() - start) / 800); btn.style.setProperty('--h', h); if (h >= 1) { finish(); return; } raf = requestAnimationFrame(paint); };
  const begin = (e) => { e.stopPropagation(); if (tapped) return; if (e.pointerId !== undefined) { try { btn.setPointerCapture(e.pointerId); } catch (_) {} } start = performance.now(); raf = requestAnimationFrame(paint); };
  const end = () => { cancelAnimationFrame(raf); if (!tapped) btn.style.setProperty('--h', 0); };
  const finish = () => { cancelAnimationFrame(raf); tapped = true; btn.classList.add('done'); document.getElementById('holdL').textContent = L().done; undoLeft = 5; tickUndo(); };
  btn.addEventListener('pointerdown', begin); btn.addEventListener('pointerup', end); btn.addEventListener('pointercancel', end); btn.addEventListener('pointerleave', end);
  btn.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); e.stopPropagation(); begin(e); } });
  btn.addEventListener('keyup', end); btn.addEventListener('contextmenu', (e) => e.preventDefault());
  btn.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
}
function tickUndo() {
  const box2 = document.getElementById('undo'); if (!box2) return; clearTimeout(undoTimer);
  if (undoLeft <= 0) { box2.innerHTML = ''; return; }
  box2.innerHTML = `<span class="num">${undoLeft}</span><button type="button" id="undoB">${L().undo}</button>`;
  document.getElementById('undoB').onclick = () => { tapped = false; undoLeft = 0; clearTimeout(undoTimer); const btn = document.getElementById('hold'); btn.classList.remove('done'); btn.style.setProperty('--h', 0); document.getElementById('holdL').textContent = L().hold; box2.textContent = L().undone; };
  undoTimer = setTimeout(() => { undoLeft--; tickUndo(); }, 1000);
}

/* ================= words in and out ================= */
let shown = -1;
function showWords(i, dir) {
  if (i === shown) return;
  anchors.forEach((a) => {
    a.el.style.setProperty('--dir', dir);
    if (a.scene === i) { a.el.classList.remove('leaving'); a.el.classList.add('on'); }
    else if (a.el.classList.contains('on')) { a.el.classList.remove('on'); a.el.classList.add('leaving'); setTimeout(() => a.el.classList.remove('leaving'), 650); }
  });
  shown = i;
}

/* ================= the step engine: one gesture = one scene ================= */
let introShown = false;
let scene = 0, busy = false, queued = 0, fl = null, introT0 = performance.now(), moved = false;
let st = { cam: poseOf(0), u: 0, hr: SCENES[0].hr, vdir: 1, speed: 0, braking: false, sceneShown: 0 };
const stage = document.getElementById('stage'), panel = document.getElementById('panel');
function go(target, opts = {}) {
  target = clamp(target, 0, LAST);
  if (target === scene) return;
  if (busy) { queued = clamp(target - scene, -1, 1); return; }
  if (!moved) { moved = true; document.getElementById('next').classList.add('hide'); }
  const from = scene, dir = target > from ? 1 : -1; scene = target; busy = true; stage.classList.add('flying');
  showWords(-1, dir);
  if (from === LAST) panel.classList.remove('up');
  const A = poseOf(from), B = poseOf(target);
  const dist = Math.hypot(B.cx - A.cx, B.cy - A.cy) * base * Math.min(A.z, B.z) / Math.max(vw, vh);
  const arc = reduce ? 0 : arcFor(dist);
  const dur = reduce ? 520 : flightMs(arc, !!opts.long);
  fl = { from, to: target, A, B, arc, t0: performance.now() + (reduce ? 0 : 160), dur, dir, uA: SCENES[from].u, uB: SCENES[target].u, hA: SCENES[from].hr, hB: SCENES[target].hr, wordsAt: reduce ? 0.6 : 0.74 };
  if (reduce) { cv.style.opacity = 0.2; setTimeout(() => { cv.style.opacity = 1; }, 240); }
}
function camAt(f, k) { return flightCam(f.A, f.B, f.arc, f.dir, k, !reduce); }
// wheel: wait for ~30px of intent, then step once; absorb the momentum tail; a rising swing is a new gesture
const stepper = new WheelStepper();
const el = (e) => (e.target instanceof Element ? e.target : document.body);
const inPanel = (e) => panel.contains(el(e));
on(window, 'wheel', (e) => {
  if (scene === LAST && !busy && inPanel(e) && (e.deltaY > 0 || panel.scrollTop > 0)) return; // the panel scrolls itself
  e.preventDefault();
  const step = stepper.push(e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY, performance.now());
  if (step) go(scene + step);
}, { passive: false });
let tY = null, tX = null;
on(window, 'touchstart', (e) => { tY = e.touches[0].clientY; tX = e.touches[0].clientX; }, { passive: true });
on(window, 'touchmove', (e) => { if (tY === null) return; const dy = tY - e.touches[0].clientY; if (scene === LAST && !busy && inPanel(e) && (dy > 0 || panel.scrollTop > 0)) { tY = null; return; } e.preventDefault(); }, { passive: false });
on(window, 'touchend', (e) => { if (tY === null) return; const tch = e.changedTouches[0], step = swipeStep(tY - tch.clientY, tX - tch.clientX); tY = null; if (step) go(scene + step); });
on(window, 'keydown', (e) => {
  if (el(e).closest('input,textarea')) return;
  if (scene === LAST && inPanel(e) && panel.scrollTop > 0) return;
  if (['ArrowDown', 'PageDown'].includes(e.key) || (e.key === ' ' && !el(e).closest('button,a,summary'))) { e.preventDefault(); go(scene + 1); }
  if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); go(scene - 1); }
  if (e.key === 'Home') { e.preventDefault(); go(0); } if (e.key === 'End') { e.preventDefault(); go(LAST); }
});

/* ================= the frame loop ================= */
let tPrev = performance.now(), hidden = false, mx = 0, my = 0, pmx = 0, pmy = 0;
on(window, 'pointermove', (e) => { if (e.pointerType === 'mouse') { mx = e.clientX / vw - 0.5; my = e.clientY / vh - 0.5; } }, { passive: true });
on(document, 'visibilitychange', () => { hidden = document.hidden; if (!hidden && !stopped) { tPrev = performance.now(); raf = requestAnimationFrame(frame); } });
function frame(now) {
  if (hidden || stopped) return;
  const dt = Math.min(0.05, (now - tPrev) / 1000); tPrev = now; const t = now / 1000;
  let c, uPrev = st.u;
  if (fl) {
    const k = clamp((now - fl.t0) / fl.dur, 0, 1);
    c = camAt(fl, k); const ek = ease(clamp(k * 1.08, 0, 1));
    st.u = lerp(fl.uA, fl.uB, ek); st.hr = lerp(fl.hA, fl.hB, easeIO(k)); st.vdir = fl.uB >= fl.uA ? 1 : -1;
    st.braking = k > 0.75 && k < 1 && Math.abs(fl.uB - fl.uA) > 0.001;
    if (k >= fl.wordsAt && shown !== fl.to) { if (fl.to < LAST) showWords(fl.to, fl.dir); st.sceneShown = fl.to; }
    if (fl.to === LAST && k > 0.55) panel.classList.add('up');
    if (k >= 1) { busy = false; fl = null; stage.classList.remove('flying'); st.sceneShown = scene; if (queued) { const q = queued; queued = 0; go(scene + q); } }
  } else c = poseOf(scene);
  st.speed = Math.abs(st.u - uPrev) / Math.max(dt, 0.001) * dt; st.cam = c;
  // intro: the camera drifts down from high above while the paper veil lifts
  const ki = reduce ? 1 : clamp((now - introT0) / 2600, 0, 1);
  if (ki < 1) { const e = ease(ki); c = { ...c, z: c.z * (0.42 + 0.58 * e), r: c.r - (1 - e) * 0.14 }; }
  if (ki > 0.3 && shown === -1 && !busy && !fl && !introShown) { introShown = true; showWords(0, 1); }
  // the camera breathes, and leans a little toward the mouse
  if (!reduce) { pmx += (mx - pmx) * 0.05; pmy += (my - pmy) * 0.05; c = { ...c, cx: c.cx + (Math.sin(t * 0.27) * 8 + pmx * 60) / c.z, cy: c.cy + (Math.cos(t * 0.21) * 6 + pmy * 40) / c.z, z: c.z * (1 + Math.sin(t * 0.33) * 0.004) }; }
  const n = draw(c, st, t);
  const night = n > 0.5 || panel.classList.contains('up'); root.classList.toggle('night', night);
  const rs = root.style;
  rs.setProperty('--fg', night ? '#F5EEE1' : '#10162F'); rs.setProperty('--fg2', night ? 'rgba(245,238,225,.8)' : '#6E6450'); rs.setProperty('--mist', night ? '16,22,47' : '245,238,225'); rs.setProperty('--paper', night ? '#10162F' : '#F5EEE1');
  for (const a of anchors) {
    if (!a.el.classList.contains('on') && !a.el.classList.contains('leaving')) continue;
    const [sx, sy] = toScreen(c, a.wx, a.wy), ew = a.el.offsetWidth, eh = a.el.offsetHeight;
    a.el.style.transform = `translate3d(${(sx - ew / 2).toFixed(1)}px, ${(sy - eh / 2).toFixed(1)}px, 0) rotate(${((a.tilt || 0) + c.r * 57.3 * 0.4).toFixed(2)}deg)`;
  }
  phoneState(c, st, t);
  const prog = fl ? lerp(fl.from, fl.to, easeIO(clamp((now - fl.t0) / fl.dur, 0, 1))) : scene;
  document.getElementById('progI').style.setProperty('--p', (prog / LAST).toFixed(4));
  const ri = fl ? fl.to : scene; [...rail.children].forEach((b, i) => b.classList.toggle('on', i === ri));
  raf = requestAnimationFrame(frame);
}


/* ================= rail and start ================= */
const rail = document.getElementById('rail');
function size() { dpr = Math.min(2, window.devicePixelRatio || 1); vw = innerWidth; vh = innerHeight; cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr); base = vw / (vw < 760 ? 950 : 1500); phoneKey = ''; place(); }
function jump(i) { if (busy || i === scene) return; const save = scene; go(i, { long: Math.abs(i - save) > 1 }); }
rail.innerHTML = copy.rail.map((r) => `<button type="button" aria-label="${r}"><span>${r}</span></button>`).join('');
[...rail.children].forEach((b, i) => b.addEventListener('click', () => jump(i)));
on(document, 'click', (e) => { const a = e.target instanceof Element ? e.target.closest('[data-stop]') : null; if (a) { e.preventDefault(); jump(+a.dataset.stop); } });
document.getElementById('next').addEventListener('click', () => go(scene + 1));
on(window, 'resize', size);
document.documentElement.classList.add('jr-lock');
size();
const veilT = setTimeout(() => document.getElementById('veil').classList.add('gone'), 60);
if (document.fonts) document.fonts.ready.then(() => { if (!stopped) place(); });
raf = requestAnimationFrame(frame);
window.__journey = { go, jump, get scene() { return scene; }, get busy() { return busy; }, get shown() { return shown; } };
return () => { stopped = true; cancelAnimationFrame(raf); clearTimeout(veilT); clearTimeout(undoTimer); offs.forEach((f) => f()); document.documentElement.classList.remove('jr-lock'); delete window.__journey; };
}
