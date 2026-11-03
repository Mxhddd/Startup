// A round, quiet action (trip, off today, family): an icon on sand, neel when it is "on".
// Used in rows instead of boxed tiles, so the sheet stays one calm surface.
import { useEffect } from 'react';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors } from '../theme';
import { Icon, type IconName } from './icons';
import { PressableScale } from './PressableScale';

export function CircleAction({ icon, label, onPress, on = false, disabled = false, testID }: { icon: IconName; label: string; onPress: () => void; on?: boolean; disabled?: boolean; testID?: string }) {
  const v = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    v.value = withTiming(on ? 1 : 0, { duration: 220 });
  }, [on, v]);
  const face = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(v.value, [0, 1], [colors.sand, colors.neel]) }));
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: on, disabled }} disabled={disabled} onPress={onPress} scaleTo="chip" testID={testID} style={{ opacity: disabled ? 0.4 : 1 }}>
      <Animated.View style={[{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }, face]}>
        <Icon name={icon} size={20} color={on ? colors.ghee : colors.neel} strokeWidth={2.3} />
      </Animated.View>
    </PressableScale>
  );
}
