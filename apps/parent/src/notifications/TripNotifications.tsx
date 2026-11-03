// Connects the parent's state to everything outside the app (v7):
// - registers for push after login, with the alert sound channels and the "Open trip" button;
// - iPhone: the Live Activity and Dynamic Island (lockScreen.ios.ts) and the widgets, filled by
//   buildLiveCard from @pohnch/core, and the card's push tokens handed to the server;
// - Android: the live notification (ongoing.ts).
import { parent } from '@pohnch/client';
import { ageParts, buildLiveCard, karachiClock, type LiveText } from '@pohnch/core';
import { useLang } from '@pohnch/ui';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect, useMemo, useRef } from 'react';
import { useParent } from '../state/ParentStore';
import { endLive, showLive, updateWidget, watchStartToken } from '../widgets/lockScreen';
import { clearOngoing, showOngoing } from './ongoing';
import { registerForPush, setupChannels } from './setup';

const STEP_KEY = { left: 'left', picked: 'picked', reached_school: 'reachedSchool', left_school: 'leftSchool', dropped: 'dropped' } as const;

export function TripNotifications({ signedIn }: { signedIn: boolean }) {
  const { t } = useLang();
  const p = useParent();
  const registered = useRef(false);

  useEffect(() => {
    if (!signedIn || registered.current) return;
    registered.current = true;
    setupChannels({ trip: t('notify.channel.trip'), live: t('notify.channel.live'), arrive: t('notify.channel.arrive'), quiet: t('notify.channel.quiet'), open: t('notify.action.open') })
      .then(registerForPush)
      .catch(() => {
        registered.current = false; // try again next time
      });
  }, [signedIn, t]);

  // iPhone: the per-phone token that lets the server start the card when the van leaves.
  useEffect(() => {
    if (!signedIn) return;
    return watchStartToken((token) => parent.registerActivityToken({ token, kind: 'start' }).catch(() => undefined));
  }, [signedIn]);

  // Tapping any Pohnch notification (or its "Open trip" button) opens the map.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => router.navigate('/'));
    return () => sub.remove();
  }, []);

  const name = p.child?.first_name ?? '';
  const live = p.phase === 'live' && p.child !== null;
  const lastDone = [...p.timeline.items].reverse().find((i) => i.at);
  const lastStep = lastDone ? [t(`step.${STEP_KEY[lastDone.step]}`), lastDone.by ? t('timeline.by', { who: lastDone.by }) : null].filter(Boolean).join(' · ') : '';
  const text: LiveText = useMemo(
    () => ({
      lead: (place) => t(`parent.place.${place}`, { name }),
      unit: t('eta.unit.home'),
      door: t('eta.door'),
      ahead: (n) => t('parent.compact.ahead', { n }),
      next: t('parent.compact.next'),
      stale: (s) => {
        const a = ageParts(s);
        return t('parent.live.lastSeen', { age: t(`age.${a.unit}`, { n: a.n }) });
      },
    }),
    [t, name],
  );
  const startedAt = p.shownTrip ? Date.parse(p.shownTrip.started_at) : p.now;
  // Rounded to the minute so the card is only re-sent when something a person would notice changes.
  const minuteNow = Math.floor(p.now / 60_000) * 60_000;
  const card = live
    ? buildLiveCard({
        name,
        kind: p.kind,
        items: p.timeline.items,
        eta: p.eta,
        now: minuteNow,
        startedAt,
        stopsAhead: p.stopsAhead,
        stale: p.signal?.stale ?? false,
        secondsAgo: p.signal?.secondsAgo ?? 0,
        lastStep,
        text,
      })
    : null;
  const cardKey = card ? JSON.stringify(card) : '';

  // Android: the live notification. iPhone: the Live Activity. Both follow the live trip.
  const wasLive = useRef(false);
  useEffect(() => {
    if (card) {
      wasLive.current = true;
      showOngoing(card).catch(() => undefined);
      const tripId = p.shownTrip?.id;
      const childId = p.child?.id;
      showLive(card, (token) => {
        if (tripId && childId) parent.registerActivityToken({ token, kind: 'update', tripId, childId }).catch(() => undefined);
      }).catch(() => undefined);
    } else {
      clearOngoing().catch(() => undefined);
      if (wasLive.current) {
        wasLive.current = false;
        endLive().catch(() => undefined);
      }
    }
  }, [cardKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // The widgets: live minutes, a finished step, the next trip, or the tagline.
  const nextTime = p.kind === 'morning' ? p.stop?.morning_time : p.stop?.afternoon_time;
  const widget = card
    ? {
        mode: card.arriveAt ? ('live' as const) : ('done' as const),
        initial: card.initial,
        name,
        title: card.arriveAt ? card.lead : card.headline,
        line: card.arriveAt ? card.ahead : lastDone?.at ? karachiClock(new Date(lastDone.at)) : '',
        arriveAt: card.arriveAt,
        startAt: card.startAt,
        progress: card.progress,
        minutes: card.minutes,
        unit: t('min.short'),
      }
    : {
        mode: 'idle' as const,
        initial: name.slice(0, 1) || 'پ',
        name: name || t('app.parent.name'),
        title: p.phase === 'idle' && nextTime ? t('parent.idle.title') : t('brand.tagline'),
        line: p.phase === 'idle' && nextTime ? t(p.kind === 'morning' ? 'parent.idle.morning' : 'parent.idle.afternoon', { time: nextTime.slice(0, 5).replace(/^0/, '') }) : '',
        arriveAt: 0,
        startAt: 0,
        progress: 0,
        minutes: '',
        unit: t('min.short'),
      };
  const widgetKey = JSON.stringify(widget);
  useEffect(() => {
    try {
      updateWidget(widget);
    } catch {
      // No widget support on this phone.
    }
  }, [widgetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
