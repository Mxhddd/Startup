// The route (v8, canvas "Z8D-Stops"): tap the map to add stops in order; each stop is a card with its
// name, the children who wait there, and its two times (☀ morning, ◐ afternoon). Tap a time to change
// it in a sheet; parents see it as "next van at 7:10". Move a stop up or down, or remove it.
// Every control is at least 64 px tall (the driver rule).
// Data: stops (row-level security lets only the van's driver change them); times are saved as HH:MM.
import { driver, type Stop } from '@pohnch/client';
import { nudgeTime, shortTime } from '@pohnch/core';
import { colors, radius, shadow, space, useLang } from '@pohnch/ui';
import { AppText, EditSheet, Icon, PressableScale, TapButton, type IconName } from '@pohnch/ui/native';
import { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { DriverMap } from '../components/DriverMap';
import { Screen } from '../components/Screen';
import { useDriver } from '../state/DriverStore';

const layout = LinearTransition.springify().damping(24).stiffness(200);
type Which = 'morning' | 'afternoon';
const DEFAULT: Record<Which, string> = { morning: '07:00', afternoon: '13:30' };

function SquareButton({ icon, label, onPress, disabled, testID }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean; testID?: string }) {
  const { dir } = useLang();
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled} scaleTo="chip" testID={testID} style={{ flex: 1 }}
      faceStyle={{ height: 64, borderRadius: 18, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', gap: 6, backgroundColor: colors.sand, opacity: disabled ? 0.35 : 1 }}>
      <Icon name={icon} size={22} color={colors.siyahi} />
      <AppText bold numberOfLines={1} style={{ fontSize: 15 }}>{label}</AppText>
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
      <AppText style={{ fontSize: 18 }}>{which === 'morning' ? '☀' : '◐'}</AppText>
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
  const { t, dir } = useLang();
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
      <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', gap: space.sm, direction: 'ltr' }}>
        {steps.map((m) => (
          <PressableScale key={m} accessibilityRole="button" accessibilityLabel={t('driver.stops.minutes', { n: m > 0 ? `+${m}` : String(m) })} haptic="tick" scaleTo="chip"
            onPress={() => setValue((v) => nudgeTime(v, m, DEFAULT.morning))} style={{ flex: 1 }} testID={`time-${m}`}
            faceStyle={{ height: 64, borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.white, boxShadow: shadow.card, alignItems: 'center', justifyContent: 'center' }}>
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
  useEffect(() => setLabels(Object.fromEntries(d.stops.map((s) => [s.id, s.label]))), [d.stops]);
  if (!d.van) return null;
  const van = d.van;
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  const namesAt = (stopId: string) => d.riders.filter((r) => r.stopId === stopId).map((r) => r.firstName).join(dir === 'rtl' ? '، ' : ', ');

  // Any change that fails (usually no signal) says so instead of silently doing nothing.
  const attempt = (fn: () => Promise<unknown>) => {
    setFailed(false);
    fn().then(d.actions.refresh).catch(() => setFailed(true));
  };
  const add = ({ lat, lng }: { lat: number; lng: number }) =>
    attempt(() => driver.addStop(van.id, { label: t('driver.stops.default', { n: d.stops.length + 1 }), lat, lng }));
  const move = (i: number, by: -1 | 1) => {
    const ids = d.stops.map((s) => s.id);
    const [x] = ids.splice(i, 1);
    if (!x) return;
    ids.splice(i + by, 0, x);
    attempt(() => driver.reorderStops(van.id, ids));
  };
  const saveTime = (time: string | null) => {
    if (!edit) return;
    const { stop, which } = edit;
    setEdit(null);
    attempt(() => driver.updateStop(stop.id, which === 'morning' ? { morning_time: time } : { afternoon_time: time }));
  };

  return (
    <Screen title={t('driver.stops.title')}>
      <AppText variant="secondary">{t('driver.stops.hint')}</AppText>
      <DriverMap pins={d.stops.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, n: s.position }))} onPress={add} />
      {failed ? <AppText color={colors.dangerText}>{t('error.offline')}</AppText> : null}
      {d.stops.length === 0 ? <AppText variant="secondary">{t('driver.stops.empty')}</AppText> : <AppText bold color={colors.ink2} style={{ fontSize: 15 }}>{t('driver.stops.timesHint')}</AppText>}
      {d.stops.map((s, i) => {
        const names = namesAt(s.id);
        return (
          <Animated.View key={s.id} testID={`stop-row-${i}`} entering={FadeInDown.delay(i * 40).springify().damping(22)} layout={layout}
            style={{ backgroundColor: colors.white, borderRadius: radius.card, borderCurve: 'continuous', boxShadow: shadow.card, padding: space.md, gap: space.sm }}>
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
            </View>
            <View style={{ flexDirection: row, alignItems: 'center', gap: space.sm }}>
              <SquareButton icon="up" label={t('driver.stops.up')} disabled={i === 0} onPress={() => move(i, -1)} />
              <SquareButton icon="down" label={t('driver.stops.down')} disabled={i === d.stops.length - 1} onPress={() => move(i, 1)} />
              <SquareButton icon="close" label={t('driver.stops.remove')} onPress={() => attempt(() => driver.removeStop(s.id))} testID={`stop-remove-${i}`} />
            </View>
          </Animated.View>
        );
      })}
      <TimeSheet edit={edit} onClose={() => setEdit(null)} onSave={saveTime} />
    </Screen>
  );
}
