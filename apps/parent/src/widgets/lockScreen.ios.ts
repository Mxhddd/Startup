// iPhone: keeps the Live Activity and the widget in step with the trip.
import type { LiveActivity } from 'expo-widgets';
import NextTripWidget, { type NextTripProps } from './NextTripWidget';
import VanActivity, { type VanActivityProps } from './VanActivity';

let current: LiveActivity<VanActivityProps> | null = null;

/** Start the Live Activity, or update it if one is already showing (also after the app restarts). */
export async function showLive(props: VanActivityProps) {
  if (!current) current = VanActivity.getInstances()[0] ?? null;
  if (current) await current.update(props);
  else current = VanActivity.start(props, 'pohnch://');
}

/** End it when the trip ends or the child is in the van; it stays briefly so the last step can be read. */
export async function endLive(final?: VanActivityProps) {
  const all = current ? [current] : VanActivity.getInstances();
  current = null;
  await Promise.all(all.map((a) => a.end('default', final)));
}

export function updateWidget(props: NextTripProps) {
  NextTripWidget.updateSnapshot(props);
}
