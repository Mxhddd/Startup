// v12 StarBurst: a one-time burst of kesar stars from a point (the Friday story, a finished week).
// Each star flies out on its own angle, turns, and fades. Reduce Motion: nothing is drawn.
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';
import { colors } from '../theme';
import { StarIcon } from './icons';

function Spark({ i, n, v, reach }: { i: number; n: number; v: SharedValue<number>; reach: number }) {
  const angle = (i / n) * Math.PI * 2 + (i % 2 ? 0.2 : -0.1);
  const far = reach * (0.7 + ((i * 37) % 30) / 100);
  const s = useAnimatedStyle(() => ({
    opacity: v.value < 0.15 ? v.value / 0.15 : 1 - v.value,
    transform: [{ translateX: Math.cos(angle) * far * v.value }, { translateY: Math.sin(angle) * far * v.value }, { rotate: `${v.value * 200}deg` }, { scale: 0.4 + v.value * 0.7 }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: -9, top: -9 }, s]}>
      <StarIcon size={i % 3 ? 14 : 18} color={i % 4 === 0 ? colors.zamurrad : colors.kesar} />
    </Animated.View>
  );
}

export function StarBurst({ count = 14, reach = 150, delay = 300, play = true }: { count?: number; reach?: number; delay?: number; play?: boolean }) {
  const v = useSharedValue(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!play || reduce) return;
    v.value = 0;
    v.value = withDelay(delay, withTiming(1, { duration: 1300, easing: Easing.out(Easing.cubic) }));
  }, [play, reduce, delay, v]);
  if (!play || reduce) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: '50%', top: '40%' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: count }, (_, i) => <Spark key={i} i={i} n={count} v={v} reach={reach} />)}
    </View>
  );
}
