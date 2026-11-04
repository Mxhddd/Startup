// v12 driver start reminder: a quiet alert 10 minutes before each run's first stop on the next school
// day ("Morning run in 10 minutes"), made on the phone (no server). Skips weekends and the van's days
// off, and uses today's changed time when there is one. Scheduled again whenever Today refreshes.
import { nextReminder } from '@pohnch/core';
import { useLang } from '@pohnch/ui';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import type { DriverStore } from '../state/DriverStore';

const ID = { morning: 'pohnch-driver-start-morning', afternoon: 'pohnch-driver-start-afternoon' } as const;

export function StartReminder({ d }: { d: DriverStore }) {
  const { t, lang } = useLang();
  const first = [...d.stops].sort((a, b) => a.position - b.position)[0];
  const key = [d.van?.id, d.van?.verified_at, first?.morning_time, first?.afternoon_time, d.daysOff.join(), d.changes.map((c) => c.date + c.kind + c.time).join(), lang].join('|');
  useEffect(() => {
    if (!d.van?.verified_at || d.riders.length === 0) return;
    (async () => {
      for (const kind of ['morning', 'afternoon'] as const) {
        await Notifications.cancelScheduledNotificationAsync(ID[kind]).catch(() => undefined);
        const at = nextReminder(kind, (kind === 'morning' ? first?.morning_time : first?.afternoon_time)?.slice(0, 5) ?? null, d.daysOff, d.changes);
        if (!at) continue;
        await Notifications.scheduleNotificationAsync({
          identifier: ID[kind],
          content: { title: t(kind === 'morning' ? 'driver.remind.morning' : 'driver.remind.afternoon'), body: t('driver.remind.body'), data: { kind: 'driver', what: 'start' } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at), ...(Platform.OS === 'android' ? { channelId: 'driver' } : {}) },
        }).catch(() => undefined);
      }
    })();
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
