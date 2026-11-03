// Android's live trip notification: our own layout (LiveTripNotification.tsx), posted once and then
// updated in place with the same id, on the quiet "Van on the way" channel. Filled from the same card as
// the iPhone Live Activity (buildLiveCard). When the app is closed, liveTask.ts does the updating.
import type { LiveCard } from '@pohnch/core';
import LiveTrip, { type LiveTripProps } from './LiveTripNotification';
import { LIVE_CHANNEL } from './setup';

export const LIVE_ID = 'pohnch-live-trip';

export function toLiveProps(card: LiveCard, unit: string): LiveTripProps {
  return { state: card.state, lead: card.lead, headline: card.headline, minutes: card.minutes, unit, progress: card.progress, ahead: card.ahead, footer: card.footer };
}

export async function showOngoing(card: LiveCard, unit = 'min') {
  const props = toLiveProps(card, unit);
  const title = card.minutes ? `${card.lead} · ${card.minutes} ${unit}` : card.headline;
  const existing = await LiveTrip.get(LIVE_ID).catch(() => null);
  if (existing) {
    await existing.update(props, { title, text: card.footer }).catch(() => LiveTrip.post(props, { id: LIVE_ID, channelId: LIVE_CHANNEL, ongoing: true, title, text: card.footer, color: '#1F2A5C', url: 'pohnch://' }));
  } else {
    await LiveTrip.post(props, { id: LIVE_ID, channelId: LIVE_CHANNEL, ongoing: true, title, text: card.footer, color: '#1F2A5C', url: 'pohnch://' });
  }
}

export async function clearOngoing() {
  const existing = await LiveTrip.get(LIVE_ID).catch(() => null);
  await existing?.cancel().catch(() => undefined);
}
