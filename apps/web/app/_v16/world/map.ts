// The city's plan as plain data: roads, your home, the roundabout, the school, the van's route,
// and the far edge (the sea and the landmarks). Also the seeded random numbers, so the city is the
// same on every visit.
import * as THREE from 'three';

export const ROADS_X = [-130, -70, -10, 50, 110];
export const ROADS_Z = [-110, -50, 10, 70];
export const ROAD_W = 12;
export const HOME = { x: -52, z: 82 };       // your house, south side of the road z = 70
export const FORK = { x: -10, z: 10, r: 11 }; // the roundabout
export const SCHOOL = { x: 80, z: -78 };     // school, north of the road z = -50
export const SHORE_Z = -228;                 // the sea begins beyond this line (north edge of the model)
// the van's route: from its first stop, past your home, round the roundabout, to the school gate
export const ROUTE: [number, number][] = [[-150, 70], [-10, 70], [-10, 21], [-21, 10], [-10, -1], [-10, -50], [80, -50], [80, -62]];

export function mulberry(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** True when a box centred at (x, z) of size w × d would touch a road. */
export const nearRoad = (x: number, z: number, w: number, d: number) =>
  ROADS_X.some((rx) => Math.abs(x - rx) < w / 2 + ROAD_W / 2 + 2) || ROADS_Z.some((rz) => Math.abs(z - rz) < d / 2 + ROAD_W / 2 + 2);

/** The route as a smooth curve (corners rounded) in the ground plane. */
export function routeCurve(): THREE.CurvePath<THREE.Vector3> {
  const path = new THREE.CurvePath<THREE.Vector3>();
  const P = ROUTE.map(([x, z]) => new THREE.Vector3(x, 0, z));
  const R = 7;
  let prev = P[0]!.clone();
  for (let i = 1; i < P.length - 1; i++) {
    const a = P[i - 1]!, b = P[i]!, c = P[i + 1]!;
    const d1 = b.clone().sub(a).normalize(), d2 = c.clone().sub(b).normalize();
    const r = Math.min(R, a.distanceTo(b) / 2, b.distanceTo(c) / 2);
    const p1 = b.clone().addScaledVector(d1, -r), p2 = b.clone().addScaledVector(d2, r);
    path.add(new THREE.LineCurve3(prev, p1));
    path.add(new THREE.QuadraticBezierCurve3(p1, b.clone(), p2));
    prev = p2;
  }
  path.add(new THREE.LineCurve3(prev, P[P.length - 1]!.clone()));
  return path;
}

/** Where on the route (0..1) is nearest to a ground point. */
export function routeU(x: number, z: number, curve = routeCurve()): number {
  let best = 0, bd = Infinity; const v = new THREE.Vector3();
  for (let k = 0; k <= 1000; k++) { curve.getPointAt(k / 1000, v); const d = (v.x - x) ** 2 + (v.z - z) ** 2; if (d < bd) { bd = d; best = k / 1000; } }
  return best;
}
