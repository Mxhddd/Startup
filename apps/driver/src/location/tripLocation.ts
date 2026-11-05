// The van's location, ONLY while a trip runs (CLAUDE.md).
// - startTripLocation(tripId) is called when a trip starts; stopTripLocation() when it ends, and also
//   whenever the app finds no running trip, so location can never keep running by mistake.
// - The phone reports every ~5 s; we send every 5 s while moving and every 30 s when stopped.
// - On Android this runs as a foreground service with a notification saying the location is shared.
// - A position that can't be sent (no signal) is dropped: an old position is useless to a parent.
import { driver } from '@pohnch/client';
import { ApiError, shouldSendPosition, toPositionBody } from '@pohnch/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

export const LOCATION_TASK = 'pohnch-trip-location';

// The newest fix, kept in memory only, so the open trip screen can show the van and the distance to
// the next stop. It exists only while the trip's location task runs; nothing is stored or logged.
export type Fix = { lat: number; lng: number; heading: number | null; speed?: number | null };
let lastFix: Fix | null = null;
const listeners = new Set<(f: Fix | null) => void>();
export function onTripFix(cb: (f: Fix | null) => void): () => void {
  listeners.add(cb);
  cb(lastFix);
  return () => listeners.delete(cb);
}
function setFix(f: Fix | null) {
  lastFix = f;
  listeners.forEach((cb) => cb(f));
}
const ACTIVE_TRIP = 'pohnch.driver.activeTrip';
const LAST_SENT = 'pohnch.driver.lastPositionAt';

// Defined when this file is first imported (the root layout imports it), so it also exists when the
// phone wakes the app in the background just to deliver locations.
TaskManager.defineTask<{ locations: Location.LocationObject[] }>(LOCATION_TASK, async ({ data, error }) => {
  if (error || !data) return;
  const tripId = await AsyncStorage.getItem(ACTIVE_TRIP);
  if (!tripId) {
    await stopTripLocation(); // no trip: never keep tracking
    return;
  }
  const latest = data.locations[data.locations.length - 1];
  if (!latest) return;
  setFix({ lat: latest.coords.latitude, lng: latest.coords.longitude, heading: latest.coords.heading ?? null, speed: latest.coords.speed ?? null });
  const lastSent = Number((await AsyncStorage.getItem(LAST_SENT)) ?? '') || null;
  if (!shouldSendPosition(lastSent, Date.now(), latest.coords.speed)) return;
  try {
    await driver.driverApi.position(toPositionBody(tripId, latest.coords, latest.timestamp));
    await AsyncStorage.setItem(LAST_SENT, String(Date.now()));
  } catch (e) {
    // The trip ended (on this or another phone) or the van was switched off: stop at once.
    if (e instanceof ApiError && ['trip_not_running', 'trip_not_found', 'not_your_van', 'van_switched_off'].includes(e.code)) {
      await stopTripLocation();
    }
  }
});

export type LocationStart = 'started' | 'denied' | 'failed';

export async function startTripLocation(tripId: string, notice: { title: string; body: string }): Promise<LocationStart> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (!fg.granted) return 'denied';
  // Needed so location keeps going with the screen off. Android shows its own "Allow all the time" page.
  await Location.requestBackgroundPermissionsAsync().catch(() => null);
  await AsyncStorage.multiSet([[ACTIVE_TRIP, tripId], [LAST_SENT, '']]);
  try {
    if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) return 'started';
    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 0,
      activityType: Location.ActivityType.AutomotiveNavigation,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: { notificationTitle: notice.title, notificationBody: notice.body, notificationColor: '#1F2A5C', killServiceOnDestroy: false },
    });
    return 'started';
  } catch {
    return 'failed';
  }
}

/**
 * Audit: keep a running trip's location going without asking for permission again (refresh calls
 * this; only starting a trip asks). If it isn't allowed, says so; if already running, nothing changes.
 */
export async function ensureTripLocation(tripId: string, notice: { title: string; body: string }): Promise<LocationStart> {
  const fg = await Location.getForegroundPermissionsAsync().catch(() => null);
  if (!fg?.granted) return 'denied';
  const active = await AsyncStorage.getItem(ACTIVE_TRIP).catch(() => null);
  try {
    if (active === tripId && (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK))) return 'started';
  } catch {
    // fall through and start it
  }
  await AsyncStorage.multiSet([[ACTIVE_TRIP, tripId], [LAST_SENT, '']]);
  try {
    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 0,
      activityType: Location.ActivityType.AutomotiveNavigation,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: { notificationTitle: notice.title, notificationBody: notice.body, notificationColor: '#1F2A5C', killServiceOnDestroy: false },
    });
    return 'started';
  } catch {
    return 'failed';
  }
}

export async function stopTripLocation(): Promise<void> {
  setFix(null);
  await AsyncStorage.multiRemove([ACTIVE_TRIP, LAST_SENT]);
  try {
    if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  } catch {
    // Nothing was running.
  }
}
