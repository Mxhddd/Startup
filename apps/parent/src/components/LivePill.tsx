// The small pill under the top bar while a trip runs: zamurrad "Live · 7:09" with a breathing pista
// dot, or grey "last seen 40 s ago" when the van's signal has dropped. It glides in from the top.
import { ageParts } from '@pohnch/core';
import { colors, durations, radius, shadow, space, useLang } from '@pohnch/ui';
import { AppText } from '@pohnch/ui/native';
import { useEffect } from 'react';
import Animated, { Easing, FadeInUp, FadeOutUp, LinearTransition, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

export function LivePill({ top, clock, staleSeconds }: { top: number; clock: string; staleSeconds: number | null }) {
  const { t, dir } = useLang();
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withRepeat(withTiming(1, { duration: durations.pulse / 2, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [v]);
  const dot = useAnimatedStyle(() => ({ opacity: 0.5 + 0.5 * (1 - v.value), transform: [{ scale: 0.8 + 0.35 * v.value }] }));
  const stale = staleSeconds !== null;
  const age = stale ? ageParts(staleSeconds) : null;
  const text = age ? t('parent.live.lastSeen', { age: t(`age.${age.unit}`, { n: age.n }) }) : t('parent.live.pill', { time: clock });
  return (
    <Animated.View
      entering={FadeInUp.springify().damping(20)}
      exiting={FadeOutUp.duration(180)}
      layout={LinearTransition.springify().damping(22)}
      accessibilityLiveRegion="polite"
      testID="live-pill"
      style={{
        position: 'absolute',
        top: top + space.md + 54,
        [dir === 'rtl' ? 'right' : 'left']: space.lg,
        height: 34,
        paddingHorizontal: 12,
        borderRadius: radius.pill,
        backgroundColor: stale ? colors.siyahi : colors.zamurrad,
        flexDirection: dir === 'rtl' ? 'row-reverse' : 'row',
        alignItems: 'center',
        gap: 8,
        boxShadow: shadow.float,
      }}
    >
      <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: stale ? colors.kesar : colors.pista }, stale ? null : dot]} />
      <AppText bold color={colors.white} style={{ fontSize: 14 }}>
        {text}
      </AppText>
    </Animated.View>
  );
}
