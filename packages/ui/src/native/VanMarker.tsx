// The van on the map: a neel disc with a white ring and the kesar van, a halo that breathes while
// it's live, and an arrow for its heading that turns the short way round.
// Grey, still and with no arrow when the signal is stale: we never pretend it moves.
import { headingDelta } from '@pohnch/core';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { durations, springs } from '../motion';
import { colors } from '../theme';

const GREY = '#8A8FA3';

export function VanMarker({ heading = 0, stale = false, size = 64 }: { heading?: number; stale?: boolean; size?: number }) {
  const rot = useSharedValue(heading);
  const breath = useSharedValue(0);
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
      cancelAnimation(breath);
      breath.value = withTiming(0, { duration: durations.fade });
    } else {
      breath.value = withRepeat(withTiming(1, { duration: durations.pulse / 2, easing: Easing.inOut(Easing.sin) }), -1, true);
    }
  }, [stale, breath]);

  const arrow = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  const halo = useAnimatedStyle(() => ({ opacity: stale ? 0 : 0.2 - breath.value * 0.1, transform: [{ scale: 0.75 + breath.value * 0.4 }] }));
  const body = useAnimatedStyle(() => ({ transform: [{ scale: appear.value }] }));
  const fill = stale ? GREY : colors.neel;

  return (
    <View testID="van-marker" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: colors.neel }, halo]} />
      {!stale ? (
        <Animated.View style={[{ position: 'absolute', width: size, height: size }, arrow]}>
          <Svg width={size} height={size} viewBox="0 0 64 64">
            <Path d="M32 5 L39 14 L25 14 Z" fill={colors.neel} stroke={colors.white} strokeWidth={2} strokeLinejoin="round" />
          </Svg>
        </Animated.View>
      ) : null}
      <Animated.View style={[{ width: size * 0.56, height: size * 0.56, boxShadow: '0px 3px 8px rgba(20,26,51,0.28)', borderRadius: size }, body]}>
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
