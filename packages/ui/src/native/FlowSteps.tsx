// The first-run progress line (v9, canvas "Z9P-FirstRun"): our route dots, one per step, joined by a
// line that fills as you go; the current step is a longer pill. Reads from the reading start.
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useLang } from '../lang';
import { colors } from '../theme';

function Dot({ state }: { state: 'done' | 'now' | 'next' }) {
  const w = useSharedValue(state === 'now' ? 26 : 10);
  useEffect(() => {
    w.value = withSpring(state === 'now' ? 26 : 10, { damping: 18, stiffness: 220 });
  }, [state, w]);
  const style = useAnimatedStyle(() => ({ width: w.value }));
  return <Animated.View style={[{ height: 10, borderRadius: 5, backgroundColor: state === 'next' ? colors.line : colors.neel }, style]} />;
}

export function FlowSteps({ step, total, label }: { step: number; total: number; label: string }) {
  const { dir } = useLang();
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 1, max: total, now: step }}
      style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, alignSelf: 'center' }}>
      {Array.from({ length: total }, (_, i) => <Dot key={i} state={i + 1 < step ? 'done' : i + 1 === step ? 'now' : 'next'} />)}
    </View>
  );
}
