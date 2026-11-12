// Everything the city paints for itself on canvases (nothing is downloaded): soft glows, clouds,
// mirror-work sparkles, the sea's shimmer, truck-art bands (chamak patti), the van's plate and its
// painted back panel, the shop-sign sheet and the rooftop boards. Painted words come from the page
// (packages/messages), never from here. Text needs the site's fonts, so every painted texture can be
// redrawn once the fonts have loaded.
import * as THREE from 'three';
import { mulberry } from './map';

export type WorldWords = {
  /** Pohnch's own lines, Urdu and English, for the rooftop boards and the van's back. */
  lines: { ur: string; en: string }[];
  /** Generic shop names for the painted shop signs (Urdu). */
  shops: string[];
  plateEn: string;
  plateUr: string;
};
export const NO_WORDS: WorldWords = { lines: [], shops: [], plateEn: '', plateUr: '' };

export const TRUCK = { neel: '#1F2A5C', neel2: '#2B3A80', kesar: '#E8A33D', zam: '#17705A', sona: '#C9A24A', pista: '#A7D47E', ghee: '#FAF6EE', rose: '#C46A8A', ink: '#141A33' };

const fontVar = (v: string, fb: string) => { try { return getComputedStyle(document.documentElement).getPropertyValue(v).trim() || fb; } catch { return fb; } };
export const urduFont = () => fontVar('--font-urdu', "'Noto Sans Arabic', sans-serif");
export const displayFont = () => fontVar('--font-display', "'Gulzar', serif");
export const latinFont = () => fontVar('--font-latin', "'Manrope', sans-serif");

type Painted = { tex: THREE.CanvasTexture; redraw: () => void };
const painted: Painted[] = [];
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, opts: { repeat?: boolean } = {}): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  if (opts.repeat) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; }
  const redraw = () => { const g = c.getContext('2d')!; g.clearRect(0, 0, w, h); draw(g, w, h); tex.needsUpdate = true; };
  redraw(); painted.push({ tex, redraw });
  return tex;
}
/** Repaint every texture with words once the fonts are ready; calls back so the world redraws. */
export function whenFontsReady(done: () => void) {
  try { void document.fonts.ready.then(() => { painted.forEach((p) => p.redraw()); done(); }); } catch { /* no font loading API */ }
}
export function forgetPainted() { painted.length = 0; }

/* ---------- soft shapes ---------- */
/** A soft round glow; `rgb` like '255,214,150', `a` the centre opacity. */
export function radial(rgb: string, a = 1, inner = 0): THREE.CanvasTexture {
  return canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, inner, 32, 32, 32); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
}
export function cloudTex() {
  return canvasTex(128, 128, (g) => { for (let k = 0; k < 6; k++) { const x = 30 + k * 14, y = 64 + Math.sin(k * 2) * 10, r = 26 + (k % 3) * 8; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); } });
}
/** A four-pointed glint, for mirror-work and the sea. */
export function sparkleTex() {
  return canvasTex(64, 64, (g) => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 14); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    g.fillStyle = 'rgba(255,248,225,.95)'; g.beginPath(); g.moveTo(32, 2); g.lineTo(35, 29); g.lineTo(62, 32); g.lineTo(35, 35); g.lineTo(32, 62); g.lineTo(29, 35); g.lineTo(2, 32); g.lineTo(29, 29); g.closePath(); g.fill();
  });
}
/** Light streaks on the sea; its offset slides so the water shimmers. */
export function waterTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#8FB7C8'; g.fillRect(0, 0, w, h);
    const r = mulberry(5);
    for (let k = 0; k < 140; k++) { const x = r() * w, y = r() * h, l = 6 + r() * 26; g.fillStyle = `rgba(255,255,255,${0.15 + r() * 0.45})`; g.fillRect(x, y, l, 1.6); }
  }, { repeat: true });
}

/* ---------- truck art ---------- */
/** One band of chamak patti: diamonds with mirror dots between painted triangles, framed in sona. */
export function chamak(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed = 1) {
  const r = mulberry(seed); const cols = [TRUCK.kesar, TRUCK.zam, TRUCK.rose, TRUCK.pista, TRUCK.ghee];
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = TRUCK.neel; g.fillRect(x, y, w, h);
  const s = h, n = Math.ceil(w / s) + 1;
  for (let i = 0; i < n; i++) {
    const cx = x + i * s + s / 2, cy = y + h / 2, c1 = cols[(i + Math.floor(r() * 2)) % cols.length]!, c2 = cols[(i + 2) % cols.length]!;
    g.fillStyle = c1; g.beginPath(); g.moveTo(cx, y + 1); g.lineTo(cx + s / 2 - 1, cy); g.lineTo(cx, y + h - 1); g.lineTo(cx - s / 2 + 1, cy); g.closePath(); g.fill();
    g.fillStyle = c2; g.beginPath(); g.moveTo(cx, y + h * 0.24); g.lineTo(cx + s * 0.26, cy); g.lineTo(cx, y + h * 0.76); g.lineTo(cx - s * 0.26, cy); g.closePath(); g.fill();
    // a little mirror in the middle
    const mr = Math.max(1.5, h * 0.1); const mg = g.createRadialGradient(cx - mr * 0.3, cy - mr * 0.3, 0, cx, cy, mr); mg.addColorStop(0, '#FFFFFF'); mg.addColorStop(1, '#B9C4D6'); g.fillStyle = mg; g.beginPath(); g.arc(cx, cy, mr, 0, Math.PI * 2); g.fill();
    // half-diamonds between, in sona
    g.fillStyle = TRUCK.sona; g.beginPath(); g.moveTo(cx + s / 2, y); g.lineTo(cx + s / 2 + s * 0.16, y + h * 0.22); g.lineTo(cx + s / 2 - s * 0.16, y + h * 0.22); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(cx + s / 2, y + h); g.lineTo(cx + s / 2 + s * 0.16, y + h * 0.78); g.lineTo(cx + s / 2 - s * 0.16, y + h * 0.78); g.closePath(); g.fill();
  }
  g.restore();
  g.strokeStyle = TRUCK.sona; g.lineWidth = Math.max(1, h * 0.07); g.strokeRect(x + g.lineWidth / 2, y + g.lineWidth / 2, w - g.lineWidth, h - g.lineWidth);
}
/** A painted flower roundel (a classic truck-art motif, here in brand colours). */
export function roundel(g: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const petals = 8;
  for (let k = 0; k < petals; k++) { const a = (k / petals) * Math.PI * 2; g.fillStyle = k % 2 ? TRUCK.kesar : TRUCK.rose; g.beginPath(); g.ellipse(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55, r * 0.42, r * 0.2, a, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = TRUCK.zam; g.beginPath(); g.arc(cx, cy, r * 0.32, 0, Math.PI * 2); g.fill();
  g.fillStyle = TRUCK.ghee; g.beginPath(); g.arc(cx, cy, r * 0.14, 0, Math.PI * 2); g.fill();
}
function fitText(g: CanvasRenderingContext2D, text: string, font: (px: number) => string, maxW: number, start: number, min = 12) {
  let px = start; do { g.font = font(px); px -= 2; } while (g.measureText(text).width > maxW && px > min);
}

/** A strip of chamak patti that repeats along a surface (van skirts, billboard edges). */
export function bandTex(seed = 3) { return canvasTex(512, 32, (g, w, h) => chamak(g, 0, 0, w, h, seed), { repeat: true }); }

/** The van's number plate: kesar, with SCHOOL VAN and اسکول وین in siyahi. */
export function plateTex(words: WorldWords) {
  return canvasTex(256, 64, (g, w, h) => {
    g.fillStyle = TRUCK.kesar; g.beginPath(); g.roundRect(2, 2, w - 4, h - 4, 8); g.fill();
    g.strokeStyle = TRUCK.ink; g.lineWidth = 3; g.beginPath(); g.roundRect(7, 7, w - 14, h - 14, 6); g.stroke();
    g.fillStyle = TRUCK.ink; g.textBaseline = 'middle';
    if (words.plateEn) { g.textAlign = 'left'; fitText(g, words.plateEn, (px) => `800 ${px}px ${latinFont()}`, 110, 22); g.fillText(words.plateEn, 16, h / 2 + 1); }
    if (words.plateUr) { g.textAlign = 'right'; g.direction = 'rtl'; fitText(g, words.plateUr, (px) => `700 ${px}px ${urduFont()}`, 100, 26); g.fillText(words.plateUr, w - 16, h / 2 + 3); }
  });
}
/** The van's painted back panel: a chamak frame, a roundel, and Pohnch's line for drivers behind. */
export function backPanelTex(words: WorldWords) {
  return canvasTex(256, 192, (g, w, h) => {
    g.fillStyle = TRUCK.neel; g.fillRect(0, 0, w, h);
    chamak(g, 0, 0, w, 22, 7); chamak(g, 0, h - 22, w, 22, 8);
    roundel(g, 30, h / 2, 20); roundel(g, w - 30, h / 2, 20);
    const line = words.lines[0]?.ur ?? '';
    if (line) {
      const parts = line.split('،').map((s) => s.trim()).filter(Boolean);
      g.fillStyle = TRUCK.ghee; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl';
      parts.slice(0, 2).forEach((p, i) => { fitText(g, p, (px) => `400 ${px}px ${displayFont()}`, w - 90, 34, 14); g.fillText(p, w / 2, h / 2 + (parts.length > 1 ? (i ? 26 : -18) : 4)); });
    }
  });
}
/** A rooftop board: chamak frame, one Pohnch line in Gulzar, its English underneath. */
export function boardTex(line: { ur: string; en: string } | undefined, seed: number) {
  return canvasTex(512, 220, (g, w, h) => {
    g.fillStyle = TRUCK.ghee; g.fillRect(0, 0, w, h);
    chamak(g, 0, 0, w, 26, seed); chamak(g, 0, h - 26, w, 26, seed + 1);
    roundel(g, 46, h / 2, 26); roundel(g, w - 46, h / 2, 26);
    if (!line) return;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = TRUCK.neel; g.direction = 'rtl'; fitText(g, line.ur, (px) => `400 ${px}px ${displayFont()}`, w - 150, 64, 20); g.fillText(line.ur, w / 2, h / 2 - 12);
    g.direction = 'ltr'; g.fillStyle = TRUCK.ink; fitText(g, line.en, (px) => `700 ${px}px ${latinFont()}`, w - 160, 22, 12); g.fillText(line.en, w / 2, h / 2 + 50);
  });
}
/** The shop-sign sheet: 4 × 4 cells of 256 × 96. Cells 0–11 are painted signs, 12–15 are shutters. */
export const SIGN_COLS = 4, SIGN_ROWS = 4, SHUTTER0 = 12;
export function signSheetTex(words: WorldWords) {
  const looks: [string, string][] = [[TRUCK.neel, TRUCK.ghee], [TRUCK.zam, TRUCK.ghee], [TRUCK.kesar, TRUCK.ink], [TRUCK.ghee, TRUCK.neel], [TRUCK.rose, TRUCK.ghee], [TRUCK.pista, TRUCK.ink]];
  return canvasTex(SIGN_COLS * 256, SIGN_ROWS * 96, (g) => {
    for (let i = 0; i < SIGN_COLS * SIGN_ROWS; i++) {
      const x = (i % SIGN_COLS) * 256, y = Math.floor(i / SIGN_COLS) * 96;
      if (i >= SHUTTER0) {
        const base = ['#9AA0A8', '#7E9C8E', '#8A94B4', '#B5A88E'][i - SHUTTER0]!;
        g.fillStyle = base; g.fillRect(x, y, 256, 96);
        for (let k = 0; k < 96; k += 6) { g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(x, y + k, 256, 1.5); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x, y + k + 2, 256, 1); }
        continue;
      }
      const [bg, fg] = looks[i % looks.length]!;
      g.fillStyle = bg; g.fillRect(x, y, 256, 96);
      g.strokeStyle = TRUCK.sona; g.lineWidth = 4; g.strokeRect(x + 5, y + 5, 246, 86);
      const word = words.shops[i % Math.max(1, words.shops.length)] ?? '';
      if (word) { g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl'; fitText(g, word, (px) => `700 ${px}px ${urduFont()}`, 220, 46, 16); g.fillText(word, x + 128, y + 52); }
    }
  });
}
/** A plain painted area sign (green, ghee border) with the visitor's area. */
export function streetSign(g: CanvasRenderingContext2D, text: string, fontFamily: string, rtl: boolean) {
  g.clearRect(0, 0, 512, 150);
  g.fillStyle = TRUCK.zam; g.beginPath(); g.roundRect(4, 4, 504, 142, 16); g.fill();
  g.strokeStyle = '#F5EEE1'; g.lineWidth = 5; g.beginPath(); g.roundRect(14, 14, 484, 122, 10); g.stroke();
  g.fillStyle = '#F5EEE1'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = rtl ? 'rtl' : 'ltr';
  fitText(g, text, (px) => `700 ${px}px ${fontFamily}`, 440, rtl ? 70 : 64, 26);
  g.fillText(text, 256, rtl ? 80 : 77);
}
