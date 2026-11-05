// v12 driver start reminder: a quiet alert 10 minutes before each run's first stop on the next school
// day ("Morning run in 10 minutes"), made on the phone (no server). Skips weekends, public holidays and
// the van's days off, and uses a changed time when there is one. Scheduled again whenever Today refreshes.
// Audit: always cancels first (also when the van is unverified, switched off or has no riders), uses the
// run's earliest stop time (the afternoon runs the stops in reverse), and once today's run of a kind has
// started, the next reminder for it is tomorrow's (no banner while driving).
import { nextReminder } from '@pohnch/core';
import { useLang } from '@pohnch/ui';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import type { DriverStore } from '../state/DriverStore';

const ID = { morning: 'pohnch-driver-start-morning', afternoon: 'pohnch-driver-start-afternoon' } as const;

export async function cancelStartReminders() {
  for (const id of Object.values(ID)) await Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
}

const earliest = (d: DriverStore, kind: 'morning' | 'afternoon') =>
  d.stops.map((s) => (kind === 'morning' ? s.morning_time : s.afternoon_time)?.slice(0, 5)).filter((x): x is string => !!x).sort()[0] ?? null;

export function StartReminder({ d }: { d: DriverStore }) {
  const { t, lang } = useLang();
  const started = d.trips.filter((x) => !x.is_practice && x.status !== 'cancelled').map((x) => x.kind);
  const key = [d.van?.id, d.van?.verified_at, d.van?.switched_off_at, d.riders.length, earliest(d, 'morning'), earliest(d, 'afternoon'), started.join(), d.daysOff.join(), d.changes.map((c) => c.date + c.kind + c.time).join(), lang].join('|');
  useEffect(() => {
    (async () => {
      await cancelStartReminders();
      if (!d.van?.verified_at || d.van.switched_off_at || d.riders.length === 0) return;
      for (const kind of ['morning', 'afternoon'] as const) {
        // Today's run of this kind already started: look from tomorrow (Karachi) on.
        const now = started.includes(kind) ? Date.parse(`${new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 10)}T19:00:00Z`) : Date.now();
        const at = nextReminder(kind, earliest(d, kind), d.daysOff, d.changes, now);
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
