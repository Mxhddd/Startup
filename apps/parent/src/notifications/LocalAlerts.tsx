// v12: alerts this phone makes by itself (no server needed), from what the app already knows:
// - "Get ready": once per trip, when the van is the chosen number of minutes from the stop;
// - "Running late": once per trip, when the estimate is 5+ minutes past the stop's usual time;
// - Friday story: every Friday at 4 pm, opens the week's story;
// - Morning brief: the next school morning, 30 minutes before the van's usual time (skipped on a
//   chutti or a van day off). First names only; no place or location in any alert.
import { addDays, getReadyDue, karachiDate } from '@pohnch/core';
import { useLang } from '@pohnch/ui';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useParent } from '../state/ParentStore';
import { DEFAULT_LOCAL, localPrefs, onLocalPrefs, type LocalPrefs } from './localPrefs';
import { stepChannel } from './setup';


const FRIDAY_ID = 'pohnch-friday-story';
const BRIEF_ID = 'pohnch-morning-brief';

function now(title: string, body: string, step: 'arriving' | 'late', data: Record<string, unknown> = {}) {
  return Notifications.scheduleNotificationAsync({
    content: { title, body, data: { ...data, local: true }, sound: Platform.OS === 'ios' ? 'default' : undefined, interruptionLevel: 'timeSensitive' },
    trigger: Platform.OS === 'android' ? { channelId: stepChannel(step) } : null,
  }).catch(() => undefined);
}

export function LocalAlerts({ signedIn }: { signedIn: boolean }) {
  const { t, lang } = useLang();
  const p = useParent();
  const [prefs, setPrefs] = useState<LocalPrefs>(DEFAULT_LOCAL);
  useEffect(() => {
    localPrefs().then(setPrefs);
    return onLocalPrefs(setPrefs);
  }, []);
  const readySent = useRef<string | null>(null);
  const lateSent = useRef<string | null>(null);
  const name = p.child?.first_name ?? '';
  const tripId = p.running?.id ?? null;

  // Get ready.
  useEffect(() => {
    if (!signedIn || !tripId || !p.child) return;
    if (!getReadyDue(p.eta, prefs.prep, readySent.current === tripId)) return;
    readySent.current = tripId;
    now(name, p.eta === 'door' ? t('parent.ready.pushDoor') : t('parent.ready.push', { min: p.eta ?? 0 }), 'arriving', { trip: tripId, children: [p.child.id] });
  }, [signedIn, tripId, p.eta, prefs.prep]); // eslint-disable-line react-hooks/exhaustive-deps

  // Running late.
  useEffect(() => {
    if (!signedIn || !tripId || p.lateMin < 5 || lateSent.current === tripId) return;
    lateSent.current = tripId;
    now(name, t('parent.late.push', { min: p.lateMin }), 'late');
  }, [signedIn, tripId, p.lateMin]); // eslint-disable-line react-hooks/exhaustive-deps

  // Friday story (weekly; scheduled again if the language changes or it's switched off).
  useEffect(() => {
    if (!signedIn) return;
    (async () => {
      await Notifications.cancelScheduledNotificationAsync(FRIDAY_ID).catch(() => undefined);
      if (!prefs.friday || !name) return;
      await Notifications.scheduleNotificationAsync({
        identifier: FRIDAY_ID,
        content: { title: t('notify.friday.title', { name }), body: t('notify.friday.body'), data: { url: '/story', local: true } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 6, hour: 16, minute: 0, ...(Platform.OS === 'android' ? { channelId: 'step-quiet' } : {}) },
      }).catch(() => undefined);
    })();
  }, [signedIn, prefs.friday, name, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  // Morning brief for the next school morning.
  const morning = p.stop?.morning_time?.slice(0, 5) ?? null;
  const key = [signedIn, prefs.brief, name, morning, p.absences.join(), p.vanDaysOff.join(), lang].join('|');
  useEffect(() => {
    if (!signedIn) return;
    (async () => {
      await Notifications.cancelScheduledNotificationAsync(BRIEF_ID).catch(() => undefined);
      if (!prefs.brief || !morning || !name) return;
      const [h, m] = morning.split(':').map(Number);
      // The next weekday whose brief time hasn't passed (Karachi = UTC+5).
      for (let i = 0; i < 7; i++) {
        const date = addDays(karachiDate(new Date()), i);
        const wd = new Date(`${date}T00:00:00Z`).getUTCDay();
        if (wd === 0 || wd === 6) continue;
        const at = Date.parse(`${date}T00:00:00Z`) - 5 * 3600_000 + ((h ?? 7) * 60 + (m ?? 0) - 30) * 60_000;
        if (at <= Date.now()) continue;
        if (p.absences.includes(date) || p.vanDaysOff.includes(date)) return;
        await Notifications.scheduleNotificationAsync({
          identifier: BRIEF_ID,
          content: { title: t('notify.brief.title', { name }), body: t('notify.brief.body', { time: morning.replace(/^0/, '') }), data: { local: true } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at), ...(Platform.OS === 'android' ? { channelId: 'step-quiet' } : {}) },
        }).catch(() => undefined);
        return;
      }
    })();
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
