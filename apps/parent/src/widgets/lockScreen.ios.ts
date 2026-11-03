// iPhone: keeps the Live Activity, the Dynamic Island and the widgets in step with the trip.
// - showLive starts the Live Activity (or updates it). The card carries an arrival time, so the
//   minutes keep counting on the lock screen by themselves between updates.
// - A staleDate three minutes ahead lets iOS dim the card if no fresher data arrives (we never pretend).
// - Each Live Activity has its own push token; we hand it to the server (onActivityToken), so the
//   server can update the card while the phone is locked (needs Apple's push key, see docs/DEV.md).
// - The push-to-start token lets the server start the card when the van leaves, even if the app was
//   never opened that morning.
import { addPushToStartTokenListener, type LiveActivity } from 'expo-widgets';
import NextTripWidget, { type NextTripProps } from './NextTripWidget';
import VanActivity, { type VanActivityProps } from './VanActivity';

let current: LiveActivity<VanActivityProps> | null = null;
let tokenSub: { remove: () => void } | null = null;
const STALE_AFTER_MS = 3 * 60_000;

export async function showLive(props: VanActivityProps, onActivityToken?: (token: string) => void) {
  const staleDate = new Date(Date.now() + STALE_AFTER_MS);
  if (!current) current = VanActivity.getInstances()[0] ?? null;
  if (current) {
    await current.update(props, staleDate);
  } else {
    current = VanActivity.start(props, 'pohnch://', staleDate);
  }
  if (onActivityToken && current && !tokenSub) {
    tokenSub = current.addPushTokenListener((e) => onActivityToken(e.pushToken));
    current.getPushToken().then((t) => (t ? onActivityToken(t) : undefined)).catch(() => undefined);
  }
}

/** End it when the trip is over; it stays a while so the last step can be read. */
export async function endLive(final?: VanActivityProps) {
  const all = current ? [current] : VanActivity.getInstances();
  current = null;
  tokenSub?.remove();
  tokenSub = null;
  await Promise.all(all.map((a) => a.end('default', final)));
}

/** Calls back with the push-to-start token whenever iOS issues one. */
export function watchStartToken(onToken: (token: string) => void): () => void {
  const sub = addPushToStartTokenListener((e) => onToken(e.activityPushToStartToken));
  return () => sub.remove();
}

export function updateWidget(props: NextTripProps) {
  NextTripWidget.updateSnapshot(props);
}
