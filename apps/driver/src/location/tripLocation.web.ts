// The browser preview never shares location.
export const LOCATION_TASK = 'pohnch-trip-location';
export type LocationStart = 'started' | 'denied' | 'failed';
export async function startTripLocation(): Promise<LocationStart> {
  return 'failed';
}
export async function stopTripLocation(): Promise<void> {}
export type Fix = { lat: number; lng: number; heading: number | null; speed?: number | null };
export function onTripFix(cb: (f: Fix | null) => void): () => void {
  cb(null);
  return () => undefined;
}
