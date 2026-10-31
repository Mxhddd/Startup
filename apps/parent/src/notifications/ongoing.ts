// Android's ongoing notification during a live trip: "6 منٹ میں گھر" and the route dots, kept at the
// top of the shade and updated in place (same identifier). Removed when the trip ends or the child is in.
// (iPhone uses the Live Activity instead.)
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { LIVE_CHANNEL } from './setup';

const ID = 'pohnch-live-trip';

export async function showOngoing(title: string, body: string) {
  if (Platform.OS !== 'android') return;
  await Notifications.scheduleNotificationAsync({
    identifier: ID,
    content: { title, body, sticky: true, autoDismiss: false, priority: Notifications.AndroidNotificationPriority.LOW, color: '#1F2A5C', data: { kind: 'live' } },
    trigger: { channelId: LIVE_CHANNEL },
  });
}

export async function clearOngoing() {
  if (Platform.OS !== 'android') return;
  await Notifications.dismissNotificationAsync(ID).catch(() => undefined);
}
