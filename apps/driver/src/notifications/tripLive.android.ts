// Posts or updates the driver's live trip notification (TripLive.tsx) in place, by a fixed id.
// Audit: a generation counter, so a post still on its way can't bring the notification back after
// clearTripLive() (the trip ended while it was being posted).
import TripLive, { type TripLiveProps } from './TripLive';

const ID = 'pohnch-driver-trip';
let generation = 0;

export async function showTripLive(props: TripLiveProps) {
  const mine = generation;
  const existing = await TripLive.get(ID).catch(() => null);
  if (mine !== generation) return;
  if (existing) await existing.update(props, { title: props.next, text: props.count }).catch(() => undefined);
  else await TripLive.post(props, { id: ID, ongoing: true, title: props.next, text: props.count, color: '#1F2A5C', url: 'pohnch-driver://' }).catch(() => undefined);
  // Cleared while it was being posted: take it down again.
  if (mine !== generation) await clearNow();
}

async function clearNow() {
  const existing = await TripLive.get(ID).catch(() => null);
  await existing?.cancel().catch(() => undefined);
}

export async function clearTripLive() {
  generation++;
  await clearNow();
}
