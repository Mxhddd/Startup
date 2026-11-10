// The roads of the home page journey (v15). Everyone starts on the same road (the spine: what Pohnch
// is, the 7 am call, the van leaving, your door, in the van) and reaches a fork: "Interested yet?".
// There the visitor picks a road: yes (how to start, then join), not sure (honest answers, our
// promises, then the rest of the day), or driver (the driver's story). Scrolling on without picking
// takes the "not sure" road, because scrolling on means "show me more". Pure data and functions.

export type Road = 'yes' | 'unsure' | 'driver';
export type SceneId =
  | 'hero' | 'calls' | 'left' | 'door' | 'van' | 'fork'
  | 'how' | 'doubts' | 'promises' | 'drvCalls' | 'drvStart'
  | 'school' | 'home' | 'end';

export const SPINE: readonly SceneId[] = ['hero', 'calls', 'left', 'door', 'van', 'fork'];
export const ROADS: Record<Road, readonly SceneId[]> = {
  yes: ['how', 'end'],
  unsure: ['doubts', 'promises', 'school', 'home', 'end'],
  driver: ['drvCalls', 'drvStart', 'home', 'end'],
};
export const DEFAULT_ROAD: Road = 'unsure';
export const ALL_SCENES: readonly SceneId[] = [...SPINE, 'how', 'doubts', 'promises', 'drvCalls', 'drvStart', 'school', 'home', 'end'];
export const FORK = SPINE.length - 1;

/** The scenes in order for a road (no choice yet = the default road). */
export function pathFor(road: Road | null): SceneId[] {
  return [...SPINE, ...ROADS[road ?? DEFAULT_ROAD]];
}

/** The road to be on to reach a scene: the current one if it already passes there, else the first that does. */
export function roadFor(id: SceneId, current: Road | null): Road | null {
  if (pathFor(current).includes(id)) return current;
  return (Object.keys(ROADS) as Road[]).find((r) => ROADS[r].includes(id)) ?? current;
}

/** Whether a scene is past the fork (the road matters there). */
export function pastFork(path: readonly SceneId[], index: number): boolean {
  return index > FORK && index < path.length;
}

/** A road from a string (a link's data-road, a stored choice); anything else is null. */
export function asRoad(s: string | null | undefined): Road | null {
  return s === 'yes' || s === 'unsure' || s === 'driver' ? s : null;
}
