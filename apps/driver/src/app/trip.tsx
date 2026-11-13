// The running trip. Taps go through the offline queue; positions are sent by the trip-only location task.
import { useLang } from '@pohnch/ui';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { setVoiceOn, voiceOn } from '../voice';
import { onTripFix, type Fix } from '../location/tripLocation';
import { clearTripLive, showTripLive } from '../notifications/tripLive';
import { RunScreen } from '../components/RunScreen';
import { DriverNotes } from '../components/DayCards';
import { distanceM, stuckInTraffic } from '@pohnch/core';
import { colors, radius10, space } from '@pohnch/ui';
import { AppText, TapButton } from '@pohnch/ui/native';
import { useRef } from 'react';
import { View } from 'react-native';
import { useDriver } from '../state/DriverStore';
import { useStage2 } from '../state/stage2';
import { stage2 } from '@pohnch/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Trip() {
  const { t } = useLang();
  const d = useDriver();
  const s2 = useStage2();
  const [fix, setFix] = useState<Fix | null>(null);
  // v12: the last ~10 minutes of fixes (speed, near a stop or not), for "stuck in traffic?".
  const recent = useRef<{ speed: number | null; atStop: boolean; at: number }[]>([]);
  const [stuck, setStuck] = useState(false);
  const [stuckDone, setStuckDone] = useState<string | null>(null);
  const stopsRef = useRef(d.stops);
  stopsRef.current = d.stops;
  useEffect(() => onTripFix((f) => {
    setFix(f);
    if (!f) return;
    const now = Date.now();
    const atStop = stopsRef.current.some((s) => distanceM({ latitude: f.lat, longitude: f.lng }, { latitude: s.lat, longitude: s.lng }) < 120);
    recent.current = [{ speed: f.speed ?? null, atStop, at: now }, ...recent.current.filter((r) => r.at > now - 10 * 60_000)];
    setStuck(stuckInTraffic(recent.current, now));
  }), []);
  const [voice, setVoice] = useState(false);
  useEffect(() => {
    voiceOn().then(setVoice);
  }, []);

  // Audit: the seat check is remembered per trip, so if the app restarts during the walk to the back
  // seats it opens the seat check again (not the finish button, which would send "reached school" twice).
  const runningId = d.running?.id ?? null;
  const seatKey = runningId ? `pohnch.driver.seat.${runningId}` : null;
  const [seat, setSeatState] = useState<string | null>(null);
  useEffect(() => {
    if (!seatKey) return;
    AsyncStorage.getItem(seatKey).then((v) => setSeatState(v)).catch(() => undefined);
  }, [seatKey]);
  const setSeat = (v: string | null) => {
    setSeatState(v);
    if (!seatKey) return;
    if (v === null) AsyncStorage.removeItem(seatKey).catch(() => undefined);
    else AsyncStorage.setItem(seatKey, v).catch(() => undefined);
  };
  // "Rain delay" sent: remembered for the trip (it used to come back after every tap).
  const [rainTold, setRainTold] = useState<string | null>(null);

  // Android: the live trip notification follows the screen (next stop, count, bar); gone at the end.
  const next = d.run.groups.find((g) => g.isNext && g.state === 'waiting');
  const liveKey = d.running ? `${d.running.id}:${d.progress.done}/${d.progress.total}:${next?.label ?? ''}` : '';
  useEffect(() => {
    if (!d.running || d.running.is_practice) {
      clearTripLive();
      return;
    }
    showTripLive({
      run: t(d.running.kind === 'morning' ? 'trip.morning' : 'trip.afternoon'),
      count: t('driver.live.count', { done: d.progress.done, total: d.progress.total }),
      next: next ? t('driver.live.next', { stop: next.label }) : t('driver.live.done'),
      progress: d.progress.total ? d.progress.done / d.progress.total : 0,
    });
  }, [liveKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => void clearTripLive(), []);

  if (!d.running) return <Redirect href="/" />;
  const kind = d.running.kind;
  const tripId = d.running.id;
  const name = new Map(d.riders.map((r) => [r.childId, r.firstName]));
  const fresh = d.signals.filter((s) => s.kind !== 'left_item' && Date.parse(s.at) > Date.now() - 30 * 60_000).slice(0, 1);
  const extra = (
    <View style={{ gap: space.sm }}>
      {!d.running.is_practice ? <DriverNotes d={d} compact told={rainTold === tripId} onRainDelay={() => { d.actions.late('rain'); setRainTold(tripId); }} /> : null}
      {fresh.map((s, i) => (
        <View key={`${s.childId}-${i}`} testID="trip-signal" style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: 14, borderRadius: radius10.row, backgroundColor: s.kind === 'sick_today' ? colors.kesarTint : colors.zamurradTint }}>
          <AppText bold color={s.kind === 'sick_today' ? colors.onKesar : colors.zamurradOnTint} style={{ fontSize: 17 }}>{`${name.get(s.childId) ?? ''}: ${t(`signal.${s.kind}`)}`}</AppText>
        </View>
      ))}
      {stuck && stuckDone !== tripId && !d.running.is_practice ? (
        <View testID="stuck" style={{ gap: 8, padding: space.md, borderRadius: radius10.group, backgroundColor: colors.kesarTint }}>
          <AppText bold color={colors.onKesar} style={{ fontSize: 17 }}>{t('driver.stuck.title')}</AppText>
          <AppText color={colors.onKesar} style={{ fontSize: 16 }}>{t('driver.stuck.body')}</AppText>
          <TapButton tone="quiet" label={t('driver.stuck.tell')} testID="stuck-tell" onConfirm={() => { d.actions.late('traffic'); setStuckDone(tripId); }} />
        </View>
      ) : null}
    </View>
  );
  return (
    <RunScreen
      onEmergency={s2 && !d.running.is_practice ? () => stage2.sendHelpAlert(d.running!.id).then(() => true).catch(() => false) : undefined}
      kind={kind}
      extra={extra}
      groups={d.run.groups}
      progress={d.progress}
      pending={d.pending}
      undo={d.undo}
      stops={d.stops}
      fix={fix}
      ready={d.ready}
      school={d.school}
      voice={voice}
      onVoice={() => {
        setVoiceOn(!voice);
        setVoice(!voice);
      }}
      onTapStop={(g, text, only) => d.actions.tapStop(g, text, only)}
      onUndo={() => d.actions.undoLast()}
      onUndoExpire={() => d.actions.clearUndo()}
      onLate={(r) => d.actions.late(r)}
      onArrive={(text) => void d.actions.reachedSchool(text)}
      seat={seat}
      onSeatChange={setSeat}
      onFinish={async () => {
        const trip = d.running;
        // The numbers for the "Trip complete" moment, taken before the trip closes.
        const minutes = trip ? Math.max(1, Math.round((Date.now() - Date.parse(trip.started_at)) / 60_000)) : null;
        const delivered = d.progress.done;
        // Go to the moment first, so Today never flashes in between; the trip ends behind it.
        // v21: practice trips end on the same "Trip complete" screen (they used to drop back to Today).
        if (trip) router.replace({ pathname: '/done', params: { kind, children: String(delivered), ...(minutes ? { minutes: String(minutes) } : {}) } });
        setSeat(null);
        // The seat check was confirmed (that's how we got here); it is queued before the end.
        await d.actions.endTrip(true);
      }}
      banner={d.running.is_practice ? t('driver.practice.note') : d.location === 'denied' || d.location === 'failed' ? t('location.off') : undefined}
    />
  );
}
