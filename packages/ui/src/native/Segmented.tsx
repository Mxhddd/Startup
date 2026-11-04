// v10: a sliding choice (this week / last week, اردو / English). One sunken track, one white thumb
// that springs to the chosen item, a tick you can feel. Replaces rows of bordered chips.
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useLang } from '../lang';
import { colors, elevation } from '../theme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

export function Segmented<T extends string>({ items, value, onChange, testID }: { items: { key: T; label: string }[]; value: T; onChange: (v: T) => void; testID?: string }) {
  const { dir } = useLang();
  const [w, setW] = useState(0);
  const i = Math.max(0, items.findIndex((x) => x.key === value));
  const cell = items.length ? (w - 8) / items.length : 0;
  const x = useSharedValue(0);
  useEffect(() => {
    // In Urdu the first item sits on the right.
    x.value = withSpring(dir === 'rtl' ? (items.length - 1 - i) * cell : i * cell, { damping: 20, stiffness: 260, mass: 0.7 });
  }, [i, cell, dir, items.length, x]);
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View testID={testID} accessibilityRole="tablist" onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: 52, borderRadius: 999, backgroundColor: colors.inset, padding: 4, flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}>
      {w > 0 ? <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 4, bottom: 4, left: 4, width: cell, borderRadius: 999, backgroundColor: colors.white, boxShadow: elevation.e1 }, thumb]} /> : null}
      {items.map((it) => (
        <PressableScale key={it.key} testID={testID ? `${testID}-${it.key}` : undefined} accessibilityRole="tab" accessibilityState={{ selected: it.key === value }} accessibilityLabel={it.label} onPress={() => onChange(it.key)} scaleTo="chip" haptic="tick" style={{ flex: 1 }}>
          <View style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <AppText bold color={it.key === value ? colors.link : colors.ink2} style={{ fontSize: 15 }}>
              {it.label}
            </AppText>
          </View>
        </PressableScale>
      ))}
    </View>
  );
}
