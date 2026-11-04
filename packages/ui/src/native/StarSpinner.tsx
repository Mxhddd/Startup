// v12 StarSpinner: the loader. The khatim star turns slowly while its centre dot breathes, in kesar
// (on dark) or neel (on light). Replaces plain spinners; Reduce Motion: the star holds still and only
// the dot breathes (gently).
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme';
import { STAR_PATH } from './icons';

export function StarSpinner({ size = 40, color, label, testID }: { size?: number; color?: string; label?: string; testID?: string }) {
  const turn = useSharedValue(0);
  const dot = useSharedValue(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!reduce) turn.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.cubic) }), -1, false);
    dot.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [turn, dot, reduce]);
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 90}deg` }] }));
  const pulse = useAnimatedStyle(() => ({ transform: [{ scale: 0.7 + 0.5 * dot.value }], opacity: 0.6 + 0.4 * dot.value }));
  const c = color ?? colors.neel;
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label} testID={testID} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: size, height: size }, spin]}>
        <Svg width={size} height={size} viewBox="0 0 64 64">
          <Path d={STAR_PATH} fill="none" stroke={c} strokeWidth={4} strokeLinejoin="round" />
        </Svg>
      </Animated.View>
      <Animated.View style={pulse}>
        <Svg width={size * 0.22} height={size * 0.22} viewBox="0 0 10 10"><Circle cx={5} cy={5} r={5} fill={colors.kesar} /></Svg>
      </Animated.View>
    </View>
  );
}
