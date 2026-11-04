// Android, app closed: the server's quiet data messages wake this task, which refreshes the live trip
// notification (or removes it when the trip is over). Defined when this file is first imported (the
// root layout imports it), so it exists when Android wakes the app just for a message.
import { findLivePayload } from '@pohnch/core';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { clearOngoing, showOngoing } from './ongoing';
import { tidyStepAlerts } from './setup';

export const LIVE_TASK = 'pohnch-live-update';

if (Platform.OS === 'android') {
  TaskManager.defineTask(LIVE_TASK, async ({ data, error }) => {
    if (error) return;
    const payload = findLivePayload(data);
    if (!payload) return;
    if (payload.end) await clearOngoing();
    else await showOngoing(payload.card, payload.unit);
    // v9: the newest step alert replaces the older ones on the lock screen.
    await tidyStepAlerts();
  });
}

export function registerLiveTask() {
  if (Platform.OS !== 'android') return;
  Notifications.registerTaskAsync(LIVE_TASK).catch(() => undefined);
}
