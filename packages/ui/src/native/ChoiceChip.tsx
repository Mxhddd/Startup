// A pill to pick one of a few (which child, which stop). The chosen one fills neel, cross-fading,
// with a light tick you can feel.
import { useEffect } from 'react';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, radius } from '../theme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

export function ChoiceChip({ label, on, onPress, testID }: { label: string; on: boolean; onPress: () => void; testID?: string }) {
  const v = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    v.value = withTiming(on ? 1 : 0, { duration: 200 });
  }, [on, v]);
  const face = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(v.value, [0, 1], [colors.white, colors.neel]),
    borderColor: interpolateColor(v.value, [0, 1], [colors.line, colors.neel]),
  }));
  return (
    <PressableScale accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={label} onPress={onPress} scaleTo="chip" haptic="tick" testID={testID}>
      <Animated.View style={[{ minHeight: 48, paddingHorizontal: 16, borderRadius: radius.pill, borderCurve: 'continuous', justifyContent: 'center', borderWidth: 2 }, face]}>
        <AppText bold color={on ? colors.ghee : colors.siyahi}>
          {label}
        </AppText>
      </Animated.View>
    </PressableScale>
  );
}
