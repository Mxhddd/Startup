// Connects the parent's state to notifications: registers for push after login, and keeps the
// Android ongoing notification (and, in round 3, the iPhone Live Activity) in step with the trip.
import { ageParts, routeDotsLine } from '@pohnch/core';
import { useLang } from '@pohnch/ui';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { useParent } from '../state/ParentStore';
import { endLive, showLive, updateWidget } from '../widgets/lockScreen';
import { clearOngoing, showOngoing } from './ongoing';
import { registerForPush, setupChannels } from './setup';

export function TripNotifications({ signedIn }: { signedIn: boolean }) {
  const { t } = useLang();
  const p = useParent();
  const registered = useRef(false);

  useEffect(() => {
    if (!signedIn || registered.current) return;
    registered.current = true;
    setupChannels({ trip: t('notify.channel.trip'), live: t('notify.channel.live') })
      .then(registerForPush)
      .catch(() => {
        registered.current = false; // try again next time
      });
  }, [signedIn, t]);

  // Tapping any Pohnch notification opens the map.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => router.navigate('/'));
    return () => sub.remove();
  }, []);

  const live = p.phase === 'live' && p.eta !== null;
  const title = live ? (p.eta === 'door' ? t('eta.door') : t('eta.home', { min: p.eta as number })) : '';
  const body = live ? t('notify.live.body', { dots: routeDotsLine(p.stopsAhead), van: p.van?.name ?? '' }) : '';

  // The last step that happened, with who marked it, for the Live Activity's bottom line.
  const STEP_KEY = { left: 'left', picked: 'picked', reached_school: 'reachedSchool', left_school: 'leftSchool', dropped: 'dropped' } as const;
  const lastDone = [...p.timeline.items].reverse().find((i) => i.at);
  const stepLine = lastDone ? [t(`step.${STEP_KEY[lastDone.step]}`), lastDone.by ? t('timeline.by', { who: lastDone.by }) : null].filter(Boolean).join(' · ') : '';
  const staleLine = p.signal?.stale ? (() => { const a = ageParts(p.signal.secondsAgo); return t('parent.live.lastSeen', { age: t(`age.${a.unit}`, { n: a.n }) }); })() : '';
  const dots = routeDotsLine(p.stopsAhead);
  const minutes = p.eta === 'door' ? '0' : String(p.eta ?? '');

  // Android: the ongoing notification. iPhone: the Live Activity. Both follow the live trip.
  const wasLive = useRef(false);
  useEffect(() => {
    if (live) {
      wasLive.current = true;
      showOngoing(title, body).catch(() => undefined);
      showLive({ title, minutes, dots, step: stepLine, stale: staleLine }).catch(() => undefined);
    } else {
      clearOngoing().catch(() => undefined);
      if (wasLive.current) {
        wasLive.current = false;
        endLive().catch(() => undefined);
      }
    }
  }, [live, title, body, minutes, dots, stepLine, staleLine]);

  // The home-screen widget: live minutes, the next trip, or the tagline.
  const nextTime = p.kind === 'morning' ? p.stop?.morning_time : p.stop?.afternoon_time;
  const widget = live
    ? { title, line: dots }
    : p.phase === 'idle' && nextTime
      ? { title: t('parent.idle.title'), line: t(p.kind === 'morning' ? 'parent.idle.morning' : 'parent.idle.afternoon', { time: nextTime.slice(0, 5) }) }
      : { title: t('app.parent.name'), line: t('brand.tagline') };
  useEffect(() => {
    try {
      updateWidget(widget);
    } catch {
      // No widget support on this phone.
    }
  }, [widget.title, widget.line]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
