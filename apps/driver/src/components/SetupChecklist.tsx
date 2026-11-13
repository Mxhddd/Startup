// The driver's first-run checklist on Today (v9, canvas "Z9D-Flow"): van, stops, times, school,
// families, a practice run. Each row ticks itself as the work gets done (read from the van's data),
// tapping a row goes there, and once everything is ready the card folds away for good.
// Plain and high-contrast like every driver screen: 64 px rows, no decoration.
import { colors, elevation, space, useLang } from '@pohnch/ui';
import { AppText, DrawnCheck, Icon, PressableScale, feel } from '@pohnch/ui/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import type { useDriver } from '../state/DriverStore';

export const PRACTICED = 'pohnch.driver.practiced.v1';
type Href = '/setup' | '/stops' | '/families' | '/practice';

export function setupSteps(d: ReturnType<typeof useDriver>, practiced: boolean): { key: string; done: boolean; href: Href }[] {
  return [
    { key: 'van', done: !!d.van, href: '/setup' },
    { key: 'stops', done: d.stops.length > 0, href: '/stops' },
    { key: 'times', done: d.stops.length > 0 && d.stops.every((s) => s.morning_time), href: '/stops' },
    { key: 'school', done: !!d.school, href: '/setup' },
    { key: 'families', done: d.riders.length + d.requests.length > 0, href: '/families' },
    { key: 'practice', done: practiced, href: '/practice' },
  ];
}

export function SetupChecklist({ d }: { d: ReturnType<typeof useDriver> }) {
  const { t, dir } = useLang();
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  const [practiced, setPracticed] = useState(true);
  useEffect(() => {
    AsyncStorage.getItem(PRACTICED).then((v) => setPracticed(v === '1')).catch(() => setPracticed(true));
  }, [d.van?.id]);
  const steps = setupSteps(d, practiced);
  const n = steps.filter((s) => s.done).length;
  const all = n === steps.length;
  // A soft success when the last step ticks while the driver is looking.
  const was = useRef(all);
  useEffect(() => {
    if (all && !was.current) feel('success');
    was.current = all;
  }, [all]);
  if (all || !d.van) return null;
  return (
    <Animated.View entering={FadeInDown.springify().damping(22).stiffness(300)} exiting={FadeOutUp.duration(260)} layout={LinearTransition.springify().damping(22).stiffness(300)} testID="setup-checklist"
      style={{ backgroundColor: colors.white, borderRadius: 28, borderCurve: 'continuous', boxShadow: elevation.e1, paddingHorizontal: space.lg, paddingTop: space.md }}>
      <AppText variant="headline">{t('driver.checklist.title', { n, of: steps.length })}</AppText>
      {steps.map((s, i) => (
        <PressableScale key={s.key} accessibilityRole="button" accessibilityState={{ checked: s.done }} onPress={() => router.push(s.href)} scaleTo="big" testID={`check-${s.key}`}>
          <View style={{ flexDirection: row, alignItems: 'center', gap: space.md, minHeight: 64 }}>
            {s.done ? (
              <DrawnCheck fill={colors.zamurrad} color={colors.white} size={30} />
            ) : (
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.inset }} />
            )}
            <AppText bold color={s.done ? colors.ink2 : colors.siyahi} style={{ flex: 1, fontSize: 17 }}>{t(`driver.checklist.${s.key}` as 'driver.checklist.van')}</AppText>
            {!s.done ? <View style={{ transform: [{ scaleX: dir === 'rtl' ? -1 : 1 }] }}><Icon name="arrow" size={18} color={colors.ink2} /></View> : null}
          </View>
        </PressableScale>
      ))}
    </Animated.View>
  );
}
