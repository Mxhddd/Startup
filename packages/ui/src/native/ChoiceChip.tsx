// A pill to pick one of a few (which child, which stop). v10: a filled pill, no border; the chosen
// one fills neel with a small tick and a soft coloured shadow, cross-fading, with a tick you can feel.
import { useEffect } from 'react';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, radius } from '../theme';
import { AppText } from './AppText';
import { Icon } from './icons';
import { PressableScale } from './PressableScale';

export function ChoiceChip({ label, on, onPress, testID }: { label: string; on: boolean; onPress: () => void; testID?: string }) {
  const v = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    v.value = withTiming(on ? 1 : 0, { duration: 200 });
  }, [on, v]);
  const face = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(v.value, [0, 1], [colors.inset, colors.neel]),
  }));
  return (
    <PressableScale accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={label} onPress={onPress} scaleTo="chip" haptic="tick" testID={testID}>
      <Animated.View style={[{ minHeight: 48, paddingHorizontal: 16, borderRadius: radius.pill, borderCurve: 'continuous', justifyContent: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, boxShadow: on ? `0px 6px 14px ${colors.neelGlow}` : undefined }, face]}>
        {on ? <Icon name="check" size={16} color={colors.onBrand} strokeWidth={3} /> : null}
        <AppText bold color={on ? colors.onBrand : colors.siyahi}>
          {label}
        </AppText>
      </Animated.View>
    </PressableScale>
  );
}
