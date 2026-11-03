// Posts or updates the driver's live trip notification (TripLive.tsx) in place, by a fixed id.
import TripLive, { type TripLiveProps } from './TripLive';

const ID = 'pohnch-driver-trip';

export async function showTripLive(props: TripLiveProps) {
  const existing = await TripLive.get(ID).catch(() => null);
  if (existing) await existing.update(props, { title: props.next, text: props.count }).catch(() => undefined);
  else await TripLive.post(props, { id: ID, ongoing: true, title: props.next, text: props.count, color: '#1F2A5C', url: 'pohnch-driver://' }).catch(() => undefined);
}

export async function clearTripLive() {
  const existing = await TripLive.get(ID).catch(() => null);
  await existing?.cancel().catch(() => undefined);
}
