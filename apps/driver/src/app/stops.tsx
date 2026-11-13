// The route (v8, canvas "Z8D-Stops"): tap the map to add stops in order; each stop is a card with its
// name, the children who wait there, and its two times (sun: morning, setting sun: afternoon). Tap a time to change
// it in a sheet; parents see it as "next van at 7:10". "Change order" turns the list into rows you
// press, hold and drag (DragList). Remove a stop with the cross.
// Every control is at least 64 px tall (the driver rule).
// Data: stops (row-level security lets only the van's driver change them); times are saved as HH:MM.
import { driver, type Stop } from '@pohnch/client';
import { bestOrder, nudgeTime, shortTime } from '@pohnch/core';
import { colors, elevation, space, useLang } from '@pohnch/ui';
import { AppText, EditSheet, Icon, PressableScale, TapButton, type IconName } from '@pohnch/ui/native';
import { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { DragList } from '../components/DragList';
import { DriverMap } from '../components/DriverMap';
import { Screen } from '../components/Screen';
import { useDriver } from '../state/DriverStore';

const layout = LinearTransition.springify().damping(24).stiffness(200);
type Which = 'morning' | 'afternoon';
const DEFAULT: Record<Which, string> = { morning: '07:00', afternoon: '13:30' };

function SquareButton({ icon, label, onPress, disabled, testID }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean; testID?: string }) {
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled} scaleTo="chip" testID={testID}
      faceStyle={{ width: 64, height: 64, borderRadius: 18, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sand, opacity: disabled ? 0.35 : 1 }}>
      <Icon name={icon} size={22} color={colors.siyahi} />
    </PressableScale>
  );
}

function TimeChip({ which, time, onPress, testID }: { which: Which; time: string | null; onPress: () => void; testID?: string }) {
  const { t } = useLang();
  const label = t(which === 'morning' ? 'driver.stops.morning' : 'driver.stops.afternoon');
  const shown = shortTime(time);
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={`${label} ${shown ?? t('driver.stops.noTime')}`} onPress={onPress} scaleTo="chip" testID={testID} style={{ flex: 1 }}
      faceStyle={{ height: 64, borderRadius: 18, borderCurve: 'continuous', backgroundColor: which === 'morning' ? colors.kesarTint : colors.neelTint, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
      <Icon name={which === 'morning' ? 'sun' : 'sunset'} size={20} color={which === 'morning' ? colors.kesarText : colors.neel} />
      {shown ? (
        <AppText variant="number" style={{ fontSize: 20, lineHeight: 26 }}>{shown}</AppText>
      ) : (
        <AppText bold color={colors.ink2} style={{ fontSize: 15 }}>{t('driver.stops.setTime')}</AppText>
      )}
    </PressableScale>
  );
}

/** The time sheet: the time in big numbers, four steps (-5, -1, +1, +5 minutes), save or clear. */
function TimeSheet({ edit, onClose, onSave }: { edit: { stop: Stop; which: Which } | null; onClose: () => void; onSave: (time: string | null) => void }) {
  const { t } = useLang();
  const [value, setValue] = useState<string>('07:00');
  useEffect(() => {
    if (edit) setValue((edit.which === 'morning' ? edit.stop.morning_time : edit.stop.afternoon_time)?.slice(0, 5) ?? DEFAULT[edit.which]);
  }, [edit]);
  const [h] = value.split(':').map(Number) as [number];
  const steps = [-5, -1, 1, 5];
  return (
    <EditSheet visible={edit !== null} onClose={onClose} testID="time-sheet"
      title={edit ? `${edit.stop.label} · ${t(edit.which === 'morning' ? 'driver.stops.morning' : 'driver.stops.afternoon')}` : ''}>
      <View style={{ alignItems: 'center', gap: 2 }}>
        <AppText variant="number" style={{ fontSize: 64, lineHeight: 76 }} testID="time-value">{shortTime(value)}</AppText>
        <AppText bold color={colors.ink2}>{h < 12 ? t('driver.stops.am') : t('driver.stops.pm')}</AppText>
      </View>
      {/* Minus to plus, left to right in both languages, like a number line. */}
      <View style={{ flexDirection: 'row', gap: space.sm, direction: 'ltr' }}>
        {steps.map((m) => (
          <PressableScale key={m} accessibilityRole="button" accessibilityLabel={t('driver.stops.minutes', { n: m > 0 ? `+${m}` : String(m) })} haptic="tick" scaleTo="chip"
            onPress={() => setValue((v) => nudgeTime(v, m, DEFAULT.morning))} style={{ flex: 1 }} testID={`time-${m}`}
            faceStyle={{ height: 64, borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.white, boxShadow: elevation.e1, alignItems: 'center', justifyContent: 'center' }}>
            <AppText variant="number" style={{ fontSize: 20, lineHeight: 26 }}>{m > 0 ? `+${m}` : `−${-m}`}</AppText>
          </PressableScale>
        ))}
      </View>
      <TapButton size="next" tone="left" label={t('common.save')} onConfirm={() => onSave(value)} testID="time-save" />
      <TapButton tone="quiet" label={t('driver.stops.clearTime')} onConfirm={() => onSave(null)} testID="time-clear" />
    </EditSheet>
  );
}

export default function Stops() {
  const { t, dir } = useLang();
  const d = useDriver();
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState(false);
  const [edit, setEdit] = useState<{ stop: Stop; which: Which } | null>(null);
  const [reordering, setReordering] = useState(false);
  const [order, setOrder] = useState<string[] | null>(null);
  const [ghosts, setGhosts] = useState<{ lat: number; lng: number }[]>([]);
  useEffect(() => setLabels(Object.fromEntries(d.stops.map((s) => [s.id, s.label]))), [d.stops]);
  if (!d.van) return null;
  const van = d.van;
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  const namesAt = (stopId: string) => d.riders.filter((r) => r.stopId === stopId).map((r) => r.firstName).join(dir === 'rtl' ? '، ' : ', ');

  // Any change that fails (usually no signal) says so instead of silently doing nothing.
  // v21: the reload runs behind (the change already shows), not in front of the next tap.
  const attempt = (fn: () => Promise<unknown>) => {
    setFailed(false);
    fn().catch(() => setFailed(true)).finally(() => void d.actions.refresh().then(() => setGhosts([])));
  };
  // v21: a new pin shows on the map the moment it's tapped (a "ghost" until the server has it).
  const add = ({ lat, lng }: { lat: number; lng: number }) => {
    setGhosts((g) => [...g, { lat, lng }]);
    attempt(() => driver.addStop(van.id, { label: t('driver.stops.default', { n: d.stops.length + 1 + ghosts.length }), lat, lng }));
  };
  // Reordering: drag in a compact list, then "Done" saves the new order once (if it changed).
  const finishReorder = () => {
    setReordering(false);
    const ids = order;
    setOrder(null);
    if (ids && ids.join() !== d.stops.map((s) => s.id).join()) attempt(() => driver.reorderStops(van.id, ids));
  };
  // v12: a shorter order (start at today's first stop, end at school), offered only if it saves 0.3 km or more.
  const best = d.stops.length >= 3 ? bestOrder(d.stops.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng })), d.school) : null;
  const better = best && best.savedKm >= 0.3 && best.order.join() !== d.stops.map((s) => s.id).join() ? best : null;
  const saveTime = (time: string | null) => {
    if (!edit) return;
    const { stop, which } = edit;
    setEdit(null);
    attempt(() => driver.updateStop(stop.id, which === 'morning' ? { morning_time: time } : { afternoon_time: time }));
  };

  return (
    <Screen title={t('driver.stops.title')}>
      <AppText variant="secondary">{t('driver.stops.hint')}</AppText>
      <DriverMap pins={[...d.stops.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, n: s.position })), ...ghosts.map((g, i) => ({ id: `ghost-${i}`, lat: g.lat, lng: g.lng, n: d.stops.length + i + 1 }))]} onPress={add} />
      {failed ? <AppText color={colors.dangerText}>{t('error.offline')}</AppText> : null}
      {d.stops.length === 0 ? <AppText variant="secondary">{t('driver.stops.empty')}</AppText> : <AppText bold color={colors.ink2} style={{ fontSize: 15 }}>{t('driver.stops.timesHint')}</AppText>}
      {d.stops.length > 1 ? (
        <PressableScale accessibilityRole="button" onPress={() => (reordering ? finishReorder() : setReordering(true))} scaleTo="chip" testID="stops-reorder"
          faceStyle={{ minHeight: 64, borderRadius: 24, borderCurve: 'continuous', backgroundColor: reordering ? colors.neel : colors.sand, flexDirection: row, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Icon name={reordering ? 'check' : 'grip'} size={22} color={reordering ? colors.ghee : colors.siyahi} strokeWidth={reordering ? 2.4 : 3.4} />
          <AppText bold color={reordering ? colors.ghee : colors.siyahi}>{reordering ? t('driver.stops.reorderDone') : t('driver.stops.reorder')}</AppText>
        </PressableScale>
      ) : null}
      {better && !reordering ? (
        <Animated.View entering={FadeInDown.springify().damping(22).stiffness(300)} testID="best-order" style={{ backgroundColor: colors.zamurradTint, borderRadius: 24, borderCurve: 'continuous', padding: space.lg, gap: space.md }}>
          <AppText bold color={colors.zamurradOnTint} style={{ fontSize: 18 }}>{t('driver.best.title', { km: better.savedKm.toFixed(1) })}</AppText>
          <AppText color={colors.zamurradOnTint} style={{ fontSize: 16 }}>{better.order.map((id) => d.stops.find((s) => s.id === id)?.label ?? '').join(dir === 'rtl' ? ' ← ' : ' → ')}</AppText>
          <TapButton tone="picked" icon="route" label={t('driver.best.use')} testID="best-order-use" onConfirm={() => attempt(() => driver.reorderStops(van.id, better.order))} />
        </Animated.View>
      ) : null}
      {reordering ? (
        <Animated.View entering={FadeInDown.springify().damping(22).stiffness(300)} style={{ gap: space.sm }}>
          <AppText variant="secondary">{t('driver.stops.dragHint')}</AppText>
          <DragList items={d.stops.map((s) => ({ id: s.id, label: s.label, sub: namesAt(s.id) || undefined }))} onChange={setOrder} />
        </Animated.View>
      ) : (
        <>
        {d.stops.map((s, i) => {
          const names = namesAt(s.id);
          return (
            <Animated.View key={s.id} testID={`stop-row-${i}`} entering={FadeInDown.delay(i * 40).springify().damping(22).stiffness(300)} layout={layout}
              style={{ backgroundColor: colors.white, borderRadius: 24, borderCurve: 'continuous', boxShadow: elevation.e1, padding: space.md, gap: space.sm }}>
              <View style={{ flexDirection: row, alignItems: 'center', gap: space.sm }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.neel, alignItems: 'center', justifyContent: 'center' }}>
                  <AppText variant="number" color={colors.white} style={{ fontSize: 16, lineHeight: 20 }}>{String(s.position)}</AppText>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    value={labels[s.id] ?? s.label}
                    onChangeText={(v) => setLabels((l) => ({ ...l, [s.id]: v }))}
                    onBlur={() => { const v = (labels[s.id] ?? '').trim(); if (v && v !== s.label) attempt(() => driver.updateStop(s.id, { label: v })); }}
                    maxLength={40}
                    accessibilityLabel={t('driver.stops.name')}
                    style={{ minHeight: 48, fontSize: 18, fontWeight: '700', color: colors.siyahi, textAlign: dir === 'rtl' ? 'right' : 'left' }}
                  />
                  {names ? <AppText variant="small" color={colors.ink2} numberOfLines={1}>{names}</AppText> : null}
                </View>
              </View>
              <View style={{ flexDirection: row, alignItems: 'center', gap: space.sm }}>
                <TimeChip which="morning" time={s.morning_time} onPress={() => setEdit({ stop: s, which: 'morning' })} testID={`stop-morning-${i}`} />
                <TimeChip which="afternoon" time={s.afternoon_time} onPress={() => setEdit({ stop: s, which: 'afternoon' })} testID={`stop-afternoon-${i}`} />
                <SquareButton icon="close" label={t('driver.stops.remove')} onPress={() => attempt(() => driver.removeStop(s.id))} testID={`stop-remove-${i}`} />
              </View>
            </Animated.View>
          );
        })}
        </>
      )}
      <TimeSheet edit={edit} onClose={() => setEdit(null)} onSave={saveTime} />
    </Screen>
  );
}
