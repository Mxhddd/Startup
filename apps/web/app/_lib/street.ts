// The paper-cut Karachi street as SVG drawing instructions: far rooftops with water tanks, a minaret
// and a dome; a mid street of balconied buildings, a palm, a pole and a power line with two birds.
// Pure functions (seeded), so the server draws them once into the page.
import { seeded } from './loop';

export type Shape = { d?: string; rect?: [number, number, number, number, number?]; stroke?: number; fill?: boolean };

export function farRoofs(w: number, base: number, seed = 3): Shape[] {
  const r = seeded(seed);
  const int = (a: number, b: number) => a + Math.floor(r() * (b - a + 1));
  let x = -10;
  let d = `M-10 ${base}`;
  const out: Shape[] = [];
  while (x < w + 10) {
    const bw = int(26, 54);
    const bh = int(18, 52);
    d += ` L${x} ${base - bh} L${x + bw} ${base - bh}`;
    if (r() < 0.55) out.push({ rect: [x + int(4, Math.max(5, bw - 16)), base - bh - 9, 12, 9, 3] });
    x += bw;
  }
  d += ` L${w + 10} ${base} Z`;
  out.unshift({ d });
  const mx = Math.round(w * 0.3);
  out.push({ rect: [mx, base - 104, 9, 104] }, { rect: [mx - 3, base - 80, 15, 5, 2] }, { d: `M${mx - 2} ${base - 104} Q${mx + 4.5} ${base - 124} ${mx + 11} ${base - 104} Z` }, { rect: [mx + 3.5, base - 132, 2, 10] });
  const dx = Math.round(w * 0.66);
  out.push({ d: `M${dx} ${base - 46} Q${dx + 22} ${base - 86} ${dx + 44} ${base - 46} Z` }, { rect: [dx + 21, base - 94, 2, 10] });
  return out;
}

export function midStreet(w: number, base: number, seed = 7): { solid: Shape[]; windows: Shape[]; lines: Shape[] } {
  const r = seeded(seed);
  const int = (a: number, b: number) => a + Math.floor(r() * (b - a + 1));
  let x = -6;
  const solid: Shape[] = [];
  const windows: Shape[] = [];
  while (x < w + 10) {
    const bw = int(44, 78);
    const bh = int(34, 70);
    solid.push({ rect: [x, base - bh, bw, bh + 2] });
    for (let k = 0; k < 2; k++) windows.push({ rect: [x + 8 + k * (Math.floor(bw / 2) - 2), base - bh + 22, 8, 10, 1.5] });
    x += bw + int(0, 6);
  }
  const px = Math.round(w * 0.78);
  const lines: Shape[] = [{ d: `M${px} ${base} C${px - 2} ${base - 30} ${px + 4} ${base - 60} ${px + 2} ${base - 84}`, stroke: 5 }];
  for (const [ddx, ddy] of [[-14, -6], [14, -6], [-18, 2], [18, 2], [-6, -10], [8, -10]] as const) {
    lines.push({ d: `M${px + 2} ${base - 84} q${ddx} ${ddy} ${ddx * 2} ${ddy * 2 + 10}`, stroke: 4 });
  }
  lines.push({ d: `M-10 ${base - 96} Q${w * 0.3} ${base - 70} ${w * 0.55} ${base - 92} T${w + 10} ${base - 90}`, stroke: 1.6 });
  lines.push({ d: `M${w * 0.42} ${base - 80} q3 -4 6 0 q3 -4 6 0`, stroke: 1.8 }, { d: `M${w * 0.47} ${base - 79} q3 -4 6 0 q3 -4 6 0`, stroke: 1.8 });
  solid.push({ rect: [Math.round(w * 0.12), base - 104, 3, 104] });
  return { solid, windows, lines };
}
