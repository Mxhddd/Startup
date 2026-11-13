// Trip complete (v8, canvas "Z8D-Done"): a full-screen moment when the driver ends a real trip.
// The check draws itself on a neel ground, a few kesar stars burst once, and two big numbers say how
// long the trip took and how many children were taken safely. One button back to Today.
// The numbers come from the trip screen as route params (nothing is read or stored here).
import { colors, space, useLang } from '@pohnch/ui';
import { AppText, DrawnCheck, StarIcon, TapButton, feel } from '@pohnch/ui/native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** One star flying out from the check, then fading. */
function Spark({ i, n }: { i: number; n: number }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(150, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [v]);
  const angle = (i / n) * Math.PI * 2;
  const style = useAnimatedStyle(() => ({
    opacity: v.value < 0.15 ? v.value / 0.15 : 1 - v.value,
    transform: [{ translateX: Math.cos(angle) * 110 * v.value }, { translateY: Math.sin(angle) * 110 * v.value }, { rotate: `${v.value * 160}deg` }, { scale: 0.4 + v.value * 0.6 }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute' }, style]}>
      <StarIcon size={16} color={colors.kesar} />
    </Animated.View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <AppText variant="number" color={colors.ghee} style={{ fontSize: 44, lineHeight: 52 }}>{value}</AppText>
      <AppText bold color={colors.mutedOnDark} align="center" style={{ fontSize: 15 }}>{label}</AppText>
    </View>
  );
}

export default function Done() {
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const { minutes, children, kind } = useLocalSearchParams<{ minutes?: string; children?: string; kind?: string }>();
  useEffect(() => {
    feel(kind === 'afternoon' ? 'dropped' : 'reached_school');
  }, [kind]);
  return (
    <View testID="trip-done" style={{ flex: 1, backgroundColor: colors.neel, experimental_backgroundImage: `linear-gradient(180deg, ${colors.neelRaised}, ${colors.neel})`, paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.xl, paddingHorizontal: space.xl }}>
      <StatusBar style="light" />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xl }}>
        <View style={{ width: 120, height: 120, alignItems: 'center', justifyContent: 'center' }}>
          {Array.from({ length: 10 }, (_, i) => <Spark key={i} i={i} n={10} />)}
          <DrawnCheck fill={colors.zamurrad} color={colors.white} size={112} />
        </View>
        <Animated.View entering={FadeInDown.delay(120).springify().damping(20).stiffness(300)} style={{ gap: space.sm, alignItems: 'center' }}>
          <AppText variant="display" color={colors.ghee} align="center" style={{ fontSize: 36 }}>{t('driver.done.title')}</AppText>
          <AppText color={colors.mutedOnDark} align="center" style={{ fontSize: 17 }}>{t(kind === 'afternoon' ? 'driver.done.afternoon' : 'driver.done.morning')}</AppText>
        </Animated.View>
        <Animated.View entering={FadeIn.delay(300).duration(260)} style={{ flexDirection: 'row', alignSelf: 'stretch', gap: space.md, paddingVertical: space.lg, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(250,246,238,0.14)' }}>
          {minutes ? <Stat value={minutes} label={t('driver.done.minutes')} /> : null}
          {children ? <Stat value={children} label={t('driver.done.children')} /> : null}
        </Animated.View>
      </View>
      <Animated.View entering={FadeInDown.delay(380).springify().damping(20).stiffness(300)}>
        <TapButton size="next" tone="reachedSchool" label={t('driver.done.back')} onConfirm={() => router.replace('/')} testID="done-back" />
      </Animated.View>
    </View>
  );
}
