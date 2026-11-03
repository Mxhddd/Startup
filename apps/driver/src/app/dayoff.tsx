// Whole-van day off (v8, canvas "Z8D-DayOff"). The driver picks today or tomorrow and holds the
// button. For 5 seconds an undo bar can take it back; only then is it saved, so a mistake never
// reaches the families. Once saved, the server sends every family on the van one push
// ("No van tomorrow · Rafiq bhai"), and the parent app shows "No van today" instead of the map.
// Leaving the screen during those 5 seconds saves it straight away.
// A day that is already off shows that, with a hold to cancel it (families are told the van is coming).
import { addDays, dayPartsOf, karachiDate } from '@pohnch/core';
import { colors, radius, shadow, space, useLang } from '@pohnch/ui';
import { AppText, PressableScale, TapButton, UndoBar } from '@pohnch/ui/native';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Screen } from '../components/Screen';
import { useDriver } from '../state/DriverStore';

function DayCard({ title, date, on, off, onPress, testID }: { title: string; date: string; on: boolean; off: boolean; onPress: () => void; testID: string }) {
  const { t } = useLang();
  const v = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    v.value = withTiming(on ? 1 : 0, { duration: 220 });
  }, [on, v]);
  const face = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(v.value, [0, 1], [colors.white, colors.neel]) }));
  return (
    <PressableScale accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`${title} ${date}`} onPress={onPress} haptic="tick" testID={testID} style={{ flex: 1 }}>
      <Animated.View style={[{ minHeight: 120, borderRadius: radius.big, borderCurve: 'continuous', boxShadow: shadow.card, padding: space.lg, gap: 6, justifyContent: 'center' }, face]}>
        <AppText bold color={on ? colors.ghee : colors.siyahi} style={{ fontSize: 26, lineHeight: 40 }}>{title}</AppText>
        <AppText bold color={on ? colors.mutedOnDark : colors.ink2} style={{ fontSize: 15 }}>{date}</AppText>
        {off ? (
          <Animated.View entering={FadeIn} style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.kesar }}>
            <AppText bold color={colors.siyahi} style={{ fontSize: 14 }}>{t('driver.dayOff.badge')}</AppText>
          </Animated.View>
        ) : null}
      </Animated.View>
    </PressableScale>
  );
}

export default function DayOff() {
  const { t, dir } = useLang();
  const d = useDriver();
  const today = karachiDate(new Date());
  const tomorrow = addDays(today, 1);
  const [pick, setPick] = useState<'today' | 'tomorrow'>(d.dayOff ? 'tomorrow' : 'today');
  const [pending, setPending] = useState<{ date: string; at: number } | null>(null);
  const [failed, setFailed] = useState(false);
  const date = pick === 'today' ? today : tomorrow;
  const isOff = d.daysOff.includes(date);

  // A day off waiting out its 5 seconds is saved if the driver leaves the screen.
  const waiting = useRef<{ date: string } | null>(null);
  waiting.current = pending;
  const setDayOff = d.actions.setDayOff;
  useEffect(() => () => {
    if (waiting.current) setDayOff(waiting.current.date, true).catch(() => undefined);
  }, [setDayOff]);

  const label = (x: string) => {
    const p = dayPartsOf(x);
    return t('date.long', { day: t(`day.${p.weekday}` as 'day.0'), date: p.date, month: t(`month.${p.month}` as 'month.1') });
  };
  const save = (x: string, off: boolean) => {
    setFailed(false);
    d.actions.setDayOff(x, off).catch(() => setFailed(true));
  };

  return (
    <Screen title={t('driver.dayOff.title')}>
      <AppText variant="secondary" style={{ fontSize: 17 }}>{t('driver.dayOff.body')}</AppText>
      <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', gap: space.md }}>
        <DayCard title={t('driver.dayOff.today')} date={label(today)} on={pick === 'today'} off={d.daysOff.includes(today)} onPress={() => setPick('today')} testID="dayoff-today" />
        <DayCard title={t('driver.dayOff.tomorrow')} date={label(tomorrow)} on={pick === 'tomorrow'} off={d.daysOff.includes(tomorrow)} onPress={() => setPick('tomorrow')} testID="dayoff-tomorrow" />
      </View>

      {failed ? <AppText color={colors.dangerText}>{t('error.offline')}</AppText> : null}

      {pending ? (
        <Animated.View entering={FadeInDown.springify()} exiting={FadeOut}>
          <UndoBar
            text={t('driver.dayOff.given')}
            tappedAt={pending.at}
            onUndo={() => setPending(null)}
            onExpire={() => {
              const x = pending.date;
              setPending(null);
              save(x, true);
            }}
          />
        </Animated.View>
      ) : isOff ? (
        <Animated.View key={`off-${date}`} entering={FadeInDown.springify()} style={{ gap: space.md }}>
          <View style={{ backgroundColor: colors.kesarTint, borderRadius: radius.card, borderCurve: 'continuous', padding: space.lg }}>
            <AppText bold style={{ fontSize: 17 }} testID="dayoff-is-off">{t('driver.dayOff.isOff')}</AppText>
          </View>
          <TapButton hold tone="quiet" label={t('driver.today.dayOffUndo')} onConfirm={() => save(date, false)} testID="dayoff-cancel" />
          <AppText variant="small" color={colors.ink2}>{t('driver.dayOff.cancelHint')}</AppText>
        </Animated.View>
      ) : (
        <Animated.View key={`on-${date}`} entering={FadeInDown.springify()} style={{ gap: space.md }}>
          <TapButton size="next" hold tone="left" icon="calendar" label={t('driver.dayOff.give')} disabled={!d.van?.verified_at}
            onConfirm={() => setPending({ date, at: Date.now() })} testID="dayoff-give" />
          <AppText variant="small" color={colors.ink2} align="center">{t('driver.dayOff.hint')}</AppText>
        </Animated.View>
      )}
    </Screen>
  );
}
