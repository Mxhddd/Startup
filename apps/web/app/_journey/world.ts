// The paper map of Karachi the journey flies over: a grid of roads, one long diagonal avenue, the sea
// at Clifton, parks with trees, blocks of buildings (seeded, so the city is the same on every visit),
// your home, the school, and the van's route between them. Plain data, no drawing.

export const W = 4800;
export const H = 3600;
export const VX = [380, 1100, 1800, 2500, 3200, 3900, 4500];
export const HY = [380, 1000, 1600, 2200, 2800, 3300];
export const AVE: [[number, number], [number, number]] = [[0, 3150], [4800, 650]];
export const HOME = { x: 1330, y: 2262 };
export const SCHOOL = { x: 3955, y: 860 };

export type Building = { x: number; y: number; w: number; h: number; z: number; tone: number; tank: boolean; win: number };
export type Rect = [number, number, number, number];
export type Tree = [number, number, number];

function distToAve(x: number, y: number): number {
  const [[x1, y1], [x2, y2]] = AVE;
  const A = y2 - y1, B = x1 - x2, C = x2 * y1 - x1 * y2;
  return Math.abs(A * x + B * y + C) / Math.hypot(A, B);
}
export const isSea = (x: number, y: number): boolean => y > 2950 - x * 0.25 && x < 1700;

function build() {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const buildings: Building[] = [], parks: Rect[] = [], trees: Tree[] = [];
  for (let i = 0; i < VX.length - 1; i++) for (let j = 0; j < HY.length - 1; j++) {
    const x0 = VX[i]! + 34, x1 = VX[i + 1]! - 34, y0 = HY[j]! + 34, y1 = HY[j + 1]! - 34;
    if (rnd() < 0.1 && !(i === 5 && j === 0)) {
      parks.push([x0, y0, x1 - x0, y1 - y0]);
      for (let k = 0; k < 14; k++) trees.push([x0 + rnd() * (x1 - x0), y0 + rnd() * (y1 - y0), 14 + rnd() * 16]);
      continue;
    }
    let y = y0;
    while (y < y1 - 40) {
      const rowH = 70 + rnd() * 90;
      let x = x0;
      while (x < x1 - 40) {
        const w = 60 + rnd() * 130, h = Math.min(rowH, y1 - y) - 14, cx = x + w / 2, cy = y + h / 2;
        const nearHome = Math.hypot(cx - HOME.x, cy - (HOME.y + 70)) < 120, nearSchool = i === 5 && j === 0;
        if (x + w < x1 && h > 30 && distToAve(cx, cy) > 90 && !isSea(cx, cy) && !nearHome && !nearSchool) {
          buildings.push({ x, y, w, h, z: 14 + rnd() * (rnd() < 0.12 ? 90 : 46), tone: Math.floor(rnd() * 3), tank: rnd() < 0.5, win: rnd() });
        }
        x += w + 10 + rnd() * 16;
      }
      y += rowH + 12;
    }
  }
  for (let k = 0; k < 220; k++) { const x = rnd() * W, y = rnd() * H; if (!isSea(x, y)) trees.push([x, y, 10 + rnd() * 12]); }
  buildings.sort((a, b) => a.y + a.h - (b.y + b.h));
  return { buildings, parks, trees };
}

export const { buildings, parks, trees } = build();

/** The van's route: from its first stop, past your home, to school. */
export const ROUTE: [number, number][] = [[380, 2200], [1800, 2200], [1800, 1600], [2500, 1600], [2500, 1000], [3955, 1000], [3955, 900]];
const segs: { a: [number, number]; b: [number, number]; l: number; s: number }[] = [];
let total = 0;
for (let i = 0; i < ROUTE.length - 1; i++) {
  const a = ROUTE[i]!, b = ROUTE[i + 1]!;
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
  segs.push({ a, b, l, s: total });
  total += l;
}
export const ROUTE_LENGTH = total;

/** A point on the route at u (0 = start, 1 = school), with the heading there. */
export function along(u: number): { x: number; y: number; ang: number } {
  const d = Math.max(0, Math.min(1, u)) * total;
  for (const s of segs) {
    if (d <= s.s + s.l) {
      const t = (d - s.s) / s.l;
      return { x: s.a[0] + (s.b[0] - s.a[0]) * t, y: s.a[1] + (s.b[1] - s.a[1]) * t, ang: Math.atan2(s.b[1] - s.a[1], s.b[0] - s.a[0]) };
    }
  }
  const s = segs[segs.length - 1]!;
  return { x: s.b[0], y: s.b[1], ang: 0 };
}
/** Where your home is along the route. */
export const homeU = (HOME.x - 380) / total;
