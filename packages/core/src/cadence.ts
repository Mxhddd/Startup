// How often the driver's phone sends the van's position during a trip (CLAUDE.md):
// every 5 s while moving, every 30 s when stopped. Never outside a trip (the caller only runs during one).
export const MOVING_EVERY_MS = 5_000;
export const STOPPED_EVERY_MS = 30_000;
/** Below about 5 km/h the van counts as stopped (traffic lights, a pick-up). */
export const MOVING_SPEED_MS = 1.4;

export function shouldSendPosition(lastSentAt: number | null, now: number, speedMs: number | null): boolean {
  if (lastSentAt === null) return true;
  const moving = (speedMs ?? 0) >= MOVING_SPEED_MS;
  return now - lastSentAt >= (moving ? MOVING_EVERY_MS : STOPPED_EVERY_MS) - 250; // a little slack for timer jitter
}

export type GpsReading = { latitude: number; longitude: number; heading: number | null; speed: number | null };

/** A GPS reading as the "position" action wants it. Phones report "unknown" heading/speed as -1. */
export function toPositionBody(tripId: string, c: GpsReading, timestamp: number) {
  const ok = (v: number | null, max: number) => (v === null || v < 0 || v > max || Number.isNaN(v) ? null : v);
  return {
    tripId,
    lat: c.latitude,
    lng: c.longitude,
    heading: ok(c.heading, 360),
    speed: ok(c.speed, 80),
    recordedAt: new Date(timestamp).toISOString(),
  };
}
