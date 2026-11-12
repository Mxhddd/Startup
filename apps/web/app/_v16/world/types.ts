// Shared types for the 3D city (v18). The page talks to the world only through these.
export type Pose = { tx: number; tz: number; dist: number; az: number; el: number; fov?: number; ty?: number };
export type WorldState = {
  pose: Pose;
  hour: number;      // 0 dawn .. 3 night
  grey: number;      // 1 = colour drained (before Pohnch)
  lit: number;       // 0..1 of the route drawn in gilt
  u: number;         // where the van is on its route, 0..1
  brake: boolean;
  school: number;    // 0..1 glow on the school gate
  homePin: number;   // 0..1 how visible the "your home" pin is
};
export type Quality = 'high' | 'mid' | 'low';
export type World = {
  quality: Quality;
  setState: (s: WorldState) => void;
  resize: () => void;
  /** Tell the world how long the last frame took (ms); it lowers or raises its resolution to stay smooth. */
  tune: (frameMs: number) => void;
  /** Show the visitor's area ("Gulshan-e-Iqbal") on a street sign by your home; null hides it. */
  setAreaLabel: (text: string | null, fontFamily: string, rtl: boolean) => void;
  project: (x: number, y: number, z: number) => [number, number, boolean];
  dispose: () => void;
  routeAt: (u: number) => [number, number];
  /** What the last frame cost to draw (for speed checks). */
  info: () => { calls: number; triangles: number };
};
