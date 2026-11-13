// Android's live trip notification (v21): a standard, ongoing notification on the quiet "Van on the way"
// channel, posted once and then replaced in place (same identifier). It used to draw a custom layout
// (expo-widgets custom notifications); on some phones that showed only an empty panel, so this uses the
// system's own notification, which every Android phone draws the same way:
//   title  "Ali's van · 8 min"
//   text   "min to your door" + "▰▰▰▰▰▱▱▱▱▱ · 2 stops before you"
// Filled from the same card as the iPhone Live Activity (buildLiveCard). When the app is closed,
// liveTask.ts does the updating.
import { liveText, type LiveCard } from '@pohnch/core';
import * as Notifications from 'expo-notifications';
import { LIVE_CHANNEL } from './setup';

export const LIVE_ID = 'pohnch-live-trip';

export async function showOngoing(card: LiveCard, unit = 'min') {
  const { title, body } = liveText(card, unit);
  await Notifications.scheduleNotificationAsync({
    identifier: LIVE_ID,
    content: {
      title,
      body,
      sticky: true,
      autoDismiss: false,
      color: '#1F2A5C',
      priority: Notifications.AndroidNotificationPriority.LOW,
      data: { url: 'pohnch://' },
    },
    trigger: { channelId: LIVE_CHANNEL },
  });
}

export async function clearOngoing() {
  await Notifications.dismissNotificationAsync(LIVE_ID).catch(() => undefined);
}
