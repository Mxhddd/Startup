// The driver's live trip notification (v21): a standard, ongoing Android notification, replaced in place by
// a fixed id. Title: the next stop. Text: the run, "3 of 6", and a text progress bar. (It used to draw a
// custom layout, which some phones showed as an empty panel; the system notification looks right on all.)
// A generation counter, so a post still on its way can't bring the notification back after
// clearTripLive() (the trip ended while it was being posted).
import { textBar } from '@pohnch/core';
import * as Notifications from 'expo-notifications';
import type { TripLiveProps } from './tripLive';

const ID = 'pohnch-driver-trip';
const CHANNEL = 'driver-trip';
let generation = 0;
let channelReady: Promise<unknown> | null = null;
// Its own quiet channel: the notification updates at every stop, so it must never ring or buzz.
const quietChannel = () =>
  (channelReady ??= Notifications.setNotificationChannelAsync(CHANNEL, { name: 'Trip in progress · سفر جاری', importance: Notifications.AndroidImportance.LOW, sound: null, vibrationPattern: null }).catch(() => undefined));

export async function showTripLive(props: TripLiveProps) {
  const mine = generation;
  await quietChannel();
  await Notifications.scheduleNotificationAsync({
    identifier: ID,
    content: {
      title: props.next,
      body: `${props.run} · ${props.count}\n${textBar(props.progress)}`,
      sticky: true,
      autoDismiss: false,
      color: '#1F2A5C',
      priority: Notifications.AndroidNotificationPriority.LOW,
      data: { url: 'pohnch-driver://' },
    },
    trigger: { channelId: CHANNEL },
  }).catch(() => undefined);
  // Cleared while it was being posted: take it down again.
  if (mine !== generation) await clearNow();
}

async function clearNow() {
  await Notifications.dismissNotificationAsync(ID).catch(() => undefined);
}

export async function clearTripLive() {
  generation++;
  await clearNow();
}
