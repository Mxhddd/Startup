// Loading placeholders that breathe: soft sand bars with a band of light gliding across them,
// shaped like what is coming, so the screen never looks empty or frozen.
import { useEffect } from 'react';
import { View, type DimensionValue } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { colors } from '../theme';

export function Shimmer({ lines }: { lines: { w: DimensionValue; h: number }[] }) {
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }), -1, false);
  }, [x]);
  const band = useAnimatedStyle(() => ({ transform: [{ translateX: -120 + x.value * 520 }], opacity: 0.55 }));
  return (
    <View style={{ gap: 12 }} accessibilityRole="progressbar">
      {lines.map((l, i) => (
        <View key={i} style={{ width: l.w, height: l.h, borderRadius: Math.min(12, l.h / 2), borderCurve: 'continuous', backgroundColor: colors.sand, overflow: 'hidden' }}>
          <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, width: 120, backgroundColor: colors.white }, band]} />
        </View>
      ))}
    </View>
  );
}
