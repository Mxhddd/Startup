// The scene at the top of each inner page (v18): one camera pose and moment of the 3D city per page.
// The same scenes are rendered into still pictures (public/v18/<id>.webp) for phones, reduced motion
// and slow devices; capable desktops get the live city with a slow drift.
import type { WorldState } from './world3d';
import { routeU } from './world/map';

export const PAGE_IDS = ['drivers', 'safety', 'privacy', 'download', 'story', 'progress', 'schools', 'lost'] as const;
export type PageId = (typeof PAGE_IDS)[number];

type Base = Omit<WorldState, 'u'> & { u: number | [number, number] };
const S = (pose: WorldState['pose'], rest: Partial<Base>): Base => ({ pose, hour: 1, grey: 0, lit: 1, u: 0.5, brake: false, school: 0, homePin: 0, ...rest });

const SCENES: Record<PageId, Base> = {
  // drivers: the van close up at a stop on your street, morning light
  drivers: S({ tx: -104, tz: 70, ty: 2.5, dist: 44, az: 4.15, el: 0.3, fov: 30 }, { hour: 0.55, lit: 0.25, u: [-104, 70], brake: true }),
  // safety: the van at the school gate, children walking in
  safety: S({ tx: 80, tz: -64, ty: 3, dist: 66, az: 1.45, el: 0.32, fov: 30 }, { hour: 0.9, u: 1, school: 0.55 }),
  // privacy: night; the location shows only along the route, glowing
  privacy: S({ tx: -20, tz: 10, dist: 300, az: 1.35, el: 0.85, fov: 24 }, { hour: 3, u: 0.5 }),
  // get the app: a rooftop at dawn
  download: S({ tx: -52, tz: 40, dist: 140, az: 1.55, el: 0.2, fov: 30 }, { hour: 0.1, lit: 0, u: 0.06 }),
  // our story: dawn over the rooftops toward Mazar-e-Quaid and the sea, kites up
  story: S({ tx: -30, tz: -170, dist: 230, az: 1.5, el: 0.17, fov: 30 }, { hour: 0.05, lit: 0, u: 0.06 }),
  // pilot progress: the whole model by day, the route lit part of the way
  progress: S({ tx: -10, tz: 0, dist: 320, az: 1.3, el: 0.75, fov: 24 }, { hour: 1, lit: 0.55, u: 0.55 }),
  // for schools: the school's front with its gate
  schools: S({ tx: 80, tz: -76, ty: 4, dist: 88, az: 1.6, el: 0.46, fov: 30 }, { hour: 0.75, u: 1, school: 0.25 }),
  // 404: the van at the very start of its route, at the edge of the map, late afternoon
  lost: S({ tx: -146, tz: 70, ty: 2, dist: 58, az: 1.75, el: 0.42, fov: 30 }, { hour: 1.7, lit: 0, u: 0 }),
};

/** The world state for a page (route positions given as a place are turned into a point on the route). */
export function pageState(id: PageId): WorldState {
  const s = SCENES[id];
  return { ...s, u: Array.isArray(s.u) ? routeU(s.u[0], s.u[1]) : s.u };
}
/** A gentle drift for the live scene: the camera sways a little around its pose. */
export function drifted(s: WorldState, t: number): WorldState {
  return { ...s, pose: { ...s.pose, az: s.pose.az + Math.sin(t / 7) * 0.05, dist: s.pose.dist * (1 + Math.sin(t / 11) * 0.02) } };
}
export const stillFor = (id: PageId, small = false): string => `/v18/${id}${small ? '-960' : ''}.webp`;
