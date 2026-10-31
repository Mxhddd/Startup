// Push notifications in the parent app.
// - Two Android channels: "Trip alerts" (a sound for each step) and "Van on the way" (the quiet,
//   ongoing notification with the minutes, updated in place).
// - After login: ask permission once, get this phone's Expo push token and save it for this parent
//   (register_push_token in the database). The server then sends a push for every step.
import { backend } from '@pohnch/client';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const TRIP_CHANNEL = 'trip';
export const LIVE_CHANNEL = 'trip-live';

// While the app is open, still show step alerts as a banner.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export async function setupChannels(names: { trip: string; live: string }) {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(TRIP_CHANNEL, {
    name: names.trip,
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: '#E8A33D',
    sound: 'default',
  });
  await Notifications.setNotificationChannelAsync(LIVE_CHANNEL, {
    name: names.live,
    importance: Notifications.AndroidImportance.LOW, // updates every few seconds: no sound, no buzz
    sound: null,
    vibrationPattern: null,
  });
}

/** Returns 'registered', 'denied', or 'skipped' (simulator, or no server yet). */
export async function registerForPush(): Promise<'registered' | 'denied' | 'skipped'> {
  if (!backend || !Device.isDevice) return 'skipped';
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return 'denied';
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) return 'skipped';
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  const { error } = await backend.supabase.rpc('register_push_token', { p_token: token, p_platform: Platform.OS === 'ios' ? 'ios' : 'android' });
  if (error) throw error;
  return 'registered';
}
