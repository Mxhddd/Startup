// Android: no Live Activity (the live trip notification does that job, see notifications/), but the
// home-screen widget is kept in step with the trip.
import NextTripWidget, { type NextTripProps } from './NextTripWidget.android';
import type { VanActivityProps } from './VanActivity';

export async function showLive(_props: VanActivityProps, _onActivityToken?: (token: string) => void) {}
export async function endLive(_final?: VanActivityProps) {}
export function watchStartToken(_onToken: (token: string) => void): () => void {
  return () => undefined;
}
export function updateWidget(props: NextTripProps) {
  NextTripWidget.updateSnapshot(props);
}
