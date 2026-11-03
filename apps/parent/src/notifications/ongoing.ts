// Android's live notification during a trip, kept at the top of the shade and updated in place.
// Filled from the same card as the iPhone Live Activity (buildLiveCard). On phones with the
// pohnch-live module (Android builds from v7) it becomes a Live Update with a progress bar and a
// countdown that ticks by itself; otherwise a plain ongoing notification. (iPhone uses the Live Activity.)
import type { LiveCard } from '@pohnch/core';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { LIVE_CHANNEL } from './setup';
import { liveModule } from './liveModule';

const ID = 'pohnch-live-trip';

export async function showOngoing(card: LiveCard) {
  if (Platform.OS !== 'android') return;
  const title = card.arriveAt ? `${card.lead} · ${card.minutes} min` : card.headline;
  const body = [card.ahead, card.footer].filter(Boolean).join(' · ');
  if (liveModule) {
    liveModule.show({ ...card, title, body });
    return;
  }
  await Notifications.scheduleNotificationAsync({
    identifier: ID,
    content: { title, body, sticky: true, autoDismiss: false, priority: Notifications.AndroidNotificationPriority.LOW, color: '#1F2A5C', data: { kind: 'live' } },
    trigger: { channelId: LIVE_CHANNEL },
  });
}

export async function clearOngoing() {
  if (Platform.OS !== 'android') return;
  if (liveModule) liveModule.clear();
  await Notifications.dismissNotificationAsync(ID).catch(() => undefined);
}
