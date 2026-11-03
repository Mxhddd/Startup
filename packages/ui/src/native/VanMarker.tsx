// The van on the map: a neel disc with a white ring and the kesar van, a halo that breathes while
// it's live, and an arrow for its heading that turns the short way round.
// Grey, still and with no arrow when the signal is stale: we never pretend it moves.
import { headingDelta } from '@pohnch/core';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { durations, springs } from '../motion';
import { colors } from '../theme';

const GREY = '#8A8FA3';
const RIPPLE_MS = 2400;

/** One ring that grows out of the van and fades, like a ripple on water. */
function Ripple({ v, size }: { v: SharedValue<number>; size: number }) {
  const style = useAnimatedStyle(() => ({ opacity: 0.32 * (1 - v.value), transform: [{ scale: 0.55 + v.value * 0.95 }] }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderCurve: 'continuous', backgroundColor: colors.neel }, style]} />;
}

export function VanMarker({ heading = 0, stale = false, size = 64 }: { heading?: number; stale?: boolean; size?: number }) {
  const rot = useSharedValue(heading);
  const r1 = useSharedValue(0);
  const r2 = useSharedValue(0);
  const appear = useSharedValue(0);

  useEffect(() => {
    // Turn the short way round, e.g. 350° to 10° is +20°, not -340°.
    rot.value = withSpring(rot.value + headingDelta(rot.value % 360, heading), springs.layout);
  }, [heading, rot]);

  useEffect(() => {
    appear.value = withSpring(1, springs.pop);
  }, [appear]);

  useEffect(() => {
    if (stale) {
      cancelAnimation(r1);
      cancelAnimation(r2);
      r1.value = withTiming(1, { duration: durations.fade });
      r2.value = withTiming(1, { duration: durations.fade });
    } else {
      const ring = () => withRepeat(withTiming(1, { duration: RIPPLE_MS, easing: Easing.out(Easing.quad) }), -1, false);
      r1.value = 0;
      r2.value = 0;
      r1.value = ring();
      r2.value = withDelay(RIPPLE_MS / 2, ring());
    }
  }, [stale, r1, r2]);

  const arrow = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  const body = useAnimatedStyle(() => ({ transform: [{ scale: appear.value }] }));
  const fill = stale ? GREY : colors.neel;

  return (
    <View testID="van-marker" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {!stale ? (
        <>
          <Ripple v={r1} size={size} />
          <Ripple v={r2} size={size} />
        </>
      ) : null}
      {!stale ? (
        <Animated.View style={[{ position: 'absolute', width: size, height: size }, arrow]}>
          <Svg width={size} height={size} viewBox="0 0 64 64">
            <Path d="M32 5 L39 14 L25 14 Z" fill={colors.neel} stroke={colors.white} strokeWidth={2} strokeLinejoin="round" />
          </Svg>
        </Animated.View>
      ) : null}
      <Animated.View style={[{ width: size * 0.56, height: size * 0.56, boxShadow: '0px 3px 8px rgba(20,26,51,0.28)', borderRadius: size, borderCurve: 'continuous' }, body]}>
        <Svg width="100%" height="100%" viewBox="0 0 36 36">
          <Circle cx="18" cy="18" r="16" fill={fill} stroke={colors.white} strokeWidth={3.5} />
          {/* the van glyph, as on the v5 map */}
          <Path d="M10 21 V14.5 h10.5 l4.5 4 v2.5 Z" fill={stale ? colors.ghee : colors.kesar} />
          <Circle cx="13.5" cy="22" r="1.8" fill={colors.ghee} />
          <Circle cx="21.5" cy="22" r="1.8" fill={colors.ghee} />
        </Svg>
      </Animated.View>
    </View>
  );
}
