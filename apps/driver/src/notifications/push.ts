// v9: the driver's alerts. Two kinds only: a family asks to join the van (tapping opens Families), and
// the Pohnch team verifies the van. Never during driving as a banner over the trip: those alerts are
// rare and happen between trips. The permission is asked only after explaining why (Today's card).
import { backend } from '@pohnch/client';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export async function alertsAllowed(): Promise<'granted' | 'undecided' | 'denied'> {
  const p = await Notifications.getPermissionsAsync().catch(() => null);
  if (!p) return 'denied';
  return p.status === 'granted' ? 'granted' : p.status === 'undetermined' && p.canAskAgain ? 'undecided' : 'denied';
}

/** Saves this phone's push token for the driver (only when alerts are allowed; never prompts). */
export async function registerDriverPush(channelName: string): Promise<boolean> {
  if (!backend || !Device.isDevice) return false;
  if ((await alertsAllowed()) !== 'granted') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('driver', { name: channelName, importance: Notifications.AndroidImportance.HIGH, lightColor: '#E8A33D' }).catch(() => undefined);
  }
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) return false;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  const { error } = await backend.supabase.rpc('register_push_token', { p_token: token, p_platform: Platform.OS === 'ios' ? 'ios' : 'android' });
  return !error;
}

/** After explaining why (Today's card): ask, then register. */
export async function askDriverAlerts(channelName: string): Promise<boolean> {
  const p = await Notifications.requestPermissionsAsync().catch(() => null);
  if (p?.status !== 'granted') return false;
  return registerDriverPush(channelName);
}

/** Registers when signed in (if already allowed) and opens Families from a request alert. */
export function useDriverPush(signedIn: boolean, channelName: string) {
  useEffect(() => {
    if (!signedIn) return;
    registerDriverPush(channelName).catch(() => undefined);
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      const data = r.notification.request.content.data as { kind?: string; what?: string } | undefined;
      if (data?.kind === 'driver' && data.what === 'request') router.navigate('/families');
      else router.navigate('/');
    });
    return () => sub.remove();
  }, [signedIn, channelName]);
}
