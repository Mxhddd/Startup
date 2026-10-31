// Small maths for the van marker: glide between two positions and turn the short way round.
export type LatLng = { latitude: number; longitude: number };

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpLatLng(a: LatLng, b: LatLng, t: number): LatLng {
  return { latitude: lerp(a.latitude, b.latitude, t), longitude: lerp(a.longitude, b.longitude, t) };
}

/** Compass bearing in degrees (0 = north, 90 = east) from a to b. */
export function bearing(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180;
  const φ1 = a.latitude * rad;
  const φ2 = b.latitude * rad;
  const Δλ = (b.longitude - a.longitude) * rad;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (Math.atan2(y, x) / rad + 360) % 360;
}

/** The signed turn from one heading to another, the short way: between -180 and 180. */
export function headingDelta(from: number, to: number): number {
  return ((((to - from) % 360) + 540) % 360) - 180;
}
