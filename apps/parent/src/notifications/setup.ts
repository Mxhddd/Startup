// Push notifications in the parent app.
// - Android channels: one per alert sound (Android fixes a channel's sound when it is made), so the
//   server can pick "chime", the two-note "pohnch", or quiet; plus "Van on the way", the silent ongoing
//   notification with the minutes, updated in place.
// - The "trip" category gives every step alert an "Open trip" button; "trip-left" adds "Off today".
// - After login: ask permission once, get this phone's Expo push token and save it for this parent
//   (register_push_token in the database). The server then sends a push for every step.
import { backend } from '@pohnch/client';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const TRIP_CHANNEL = 'step-chime';
export const LIVE_CHANNEL = 'trip-live';
export const ALERT_CHANNELS = { chime: 'step-chime', pohnch: 'step-pohnch', quiet: 'step-quiet' } as const;

// While the app is open, still show step alerts as a banner.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export async function setupChannels(names: { trip: string; live: string; arrive: string; quiet: string; open: string; offToday: string }) {
  // The button on every step alert, on both platforms.
  await Notifications.setNotificationCategoryAsync('trip', [{ identifier: 'open', buttonTitle: names.open, options: { opensAppToForeground: true } }]).catch(() => undefined);
  // The morning "van left" alert also offers "Off today" (v8): it opens the chutti calendar with today chosen.
  await Notifications.setNotificationCategoryAsync('trip-left', [
    { identifier: 'open', buttonTitle: names.open, options: { opensAppToForeground: true } },
    { identifier: 'chutti', buttonTitle: names.offToday, options: { opensAppToForeground: true } },
  ]).catch(() => undefined);
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ALERT_CHANNELS.chime, {
    name: names.trip,
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: '#E8A33D',
    sound: 'chime.wav',
  });
  await Notifications.setNotificationChannelAsync(ALERT_CHANNELS.pohnch, {
    name: names.arrive,
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: '#E8A33D',
    sound: 'pohnch.wav',
  });
  await Notifications.setNotificationChannelAsync(ALERT_CHANNELS.quiet, {
    name: names.quiet,
    importance: Notifications.AndroidImportance.HIGH,
    sound: null,
  });
  // The old single channel from before v7 is no longer used.
  await Notifications.deleteNotificationChannelAsync('trip').catch(() => undefined);
  await Notifications.setNotificationChannelAsync(LIVE_CHANNEL, {
    name: names.live,
    importance: Notifications.AndroidImportance.LOW, // updates every few seconds: no sound, no buzz
    sound: null,
    vibrationPattern: null,
  });
}

/**
 * Asks the phone for permission to show alerts. Only called after explaining why (the welcome
 * screens, or the notification settings): a prompt with no reason is the one people say no to.
 */
export async function askForAlerts(): Promise<boolean> {
  const now = await Notifications.getPermissionsAsync();
  if (now.status === 'granted') return true;
  if (!now.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).status === 'granted';
}

/** Whether the phone has never been asked yet (so the app can explain first, then ask). */
export async function alertsUndecided(): Promise<boolean> {
  const now = await Notifications.getPermissionsAsync();
  return now.status === 'undetermined' && now.canAskAgain;
}

/**
 * Registers this phone for pushes when alerts are allowed. Never shows the system prompt itself:
 * returns 'denied' if alerts aren't allowed (yet), 'skipped' on a simulator or with no server yet.
 */
export async function registerForPush(): Promise<'registered' | 'denied' | 'skipped'> {
  if (!backend || !Device.isDevice) return 'skipped';
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return 'denied';
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) return 'skipped';
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  const { error } = await backend.supabase.rpc('register_push_token', { p_token: token, p_platform: Platform.OS === 'ios' ? 'ios' : 'android' });
  if (error) throw error;
  return 'registered';
}

/** Plays an alert sound now, as a local notification, so a parent can hear it in settings. */
export async function previewSound(kind: 'chime' | 'pohnch', title: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, sound: `${kind}.wav`, data: { kind: 'preview' } },
    trigger: Platform.OS === 'android' ? { channelId: ALERT_CHANNELS[kind] } : null,
  });
}
