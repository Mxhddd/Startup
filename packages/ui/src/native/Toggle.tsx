// An on/off switch: the knob springs across with a small overshoot, the track cross-fades to
// zamurrad, and a light tick is felt. Real switch semantics for screen readers.
import { useEffect } from 'react';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useLang } from '../lang';
import { colors } from '../theme';
import { feel } from './feedback';
import { PressableScale } from './PressableScale';

export function Toggle({ value, onChange, label, testID }: { value: boolean; onChange: (v: boolean) => void; label: string; testID?: string }) {
  const { dir } = useLang();
  const v = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    v.value = withSpring(value ? 1 : 0, { damping: 15, stiffness: 260, mass: 0.6 });
  }, [value, v]);
  const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(v.value, [0, 1], [colors.toggleOff, colors.zamurrad]) }));
  // "On" sits at the reading end: left in Urdu, right in English.
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: (dir === 'rtl' ? -1 : 1) * v.value * 22 }] }));
  return (
    <PressableScale accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={label} onPress={() => { feel(value ? 'toggleOff' : 'toggleOn'); onChange(!value); }} scaleTo="chip" haptic="none" testID={testID} hitSlop={8}>
      <Animated.View style={[{ width: 56, height: 34, borderRadius: 17, padding: 3, boxShadow: 'inset 0px 2px 4px rgba(0,0,0,0.12)', alignItems: dir === 'rtl' ? 'flex-end' : 'flex-start' }, track]}>
        <Animated.View style={[{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.white, boxShadow: '0px 2px 6px rgba(20,26,51,0.25)' }, knob]} />
      </Animated.View>
    </PressableScale>
  );
}
