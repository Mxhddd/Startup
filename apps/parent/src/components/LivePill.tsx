// The small pill under the top bar while a trip runs: zamurrad "Live · 7:09" with a breathing pista
// dot, or grey "last seen 40 s ago" when the van's signal has dropped. It glides in from the top.
import { ageParts } from '@pohnch/core';
import { colors, radius, space, useLang } from '@pohnch/ui';
import { AppText, Glass } from '@pohnch/ui/native';
import { useEffect } from 'react';
import Animated, { Easing, FadeInUp, FadeOutUp, LinearTransition, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

export function LivePill({ top, clock, staleSeconds }: { top: number; clock: string; staleSeconds: number | null }) {
  const { t, dir } = useLang();
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false);
  }, [v]);
  // A ping: a ring leaves the dot and fades, every 1.8 s, like a radar.
  const ping = useAnimatedStyle(() => ({ opacity: 0.7 * (1 - v.value), transform: [{ scale: 1 + 1.6 * v.value }] }));
  const stale = staleSeconds !== null;
  const age = stale ? ageParts(staleSeconds) : null;
  const text = age ? t('parent.live.lastSeen', { age: t(`age.${age.unit}`, { n: age.n }) }) : t('parent.live.pill', { time: clock });
  return (
    <Animated.View
      entering={FadeInUp.delay(100).springify().damping(20).stiffness(300)}
      exiting={FadeOutUp.duration(180)}
      layout={LinearTransition.springify().damping(22).stiffness(300)}
      accessibilityLiveRegion="polite"
      testID="live-pill"
      style={{ position: 'absolute', top: top + space.md + 58, [dir === 'rtl' ? 'right' : 'left']: space.gutter }}
    >
      <Glass tone={stale ? 'dark' : 'light'} style={{ height: 36, paddingHorizontal: 14, borderRadius: radius.pill, borderCurve: 'continuous', flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 10, backgroundColor: stale ? colors.siyahi : undefined }}>
        <Animated.View style={{ width: 10, height: 10 }}>
          {!stale ? <Animated.View style={[{ position: 'absolute', width: 10, height: 10, borderRadius: 5, borderCurve: 'continuous', backgroundColor: colors.zamurrad }, ping]} /> : null}
          <Animated.View style={{ width: 10, height: 10, borderRadius: 5, borderCurve: 'continuous', backgroundColor: stale ? colors.kesar : colors.zamurrad }} />
        </Animated.View>
        <AppText bold color={stale ? colors.ghee : colors.zamurradOnTint} style={{ fontSize: 14 }}>
          {text}
        </AppText>
      </Glass>
    </Animated.View>
  );
}
