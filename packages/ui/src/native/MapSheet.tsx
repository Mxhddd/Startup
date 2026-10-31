// The parent's bottom sheet over the map. Drag the grab bar between two heights: peek and open.
// It snaps to the nearer one when let go.
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useLang } from '../lang';
import { colors, radius, space } from '../theme';

export function MapSheet({ children, peek = 220, open = 520, bottomInset = 0 }: { children: ReactNode; peek?: number; open?: number; bottomInset?: number }) {
  const { t } = useLang();
  const hidden = open - peek; // how far down the sheet sits when peeking
  const y = useSharedValue(hidden);
  const startY = useSharedValue(hidden);

  const pan = Gesture.Pan()
    .onBegin(() => {
      startY.value = y.value;
    })
    .onUpdate((e) => {
      y.value = Math.min(hidden, Math.max(0, startY.value + e.translationY));
    })
    .onEnd((e) => {
      const goOpen = e.velocityY < -300 || (e.velocityY < 300 && y.value < hidden / 2);
      y.value = withSpring(goOpen ? 0 : hidden, { damping: 22, stiffness: 220 });
    });

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  return (
    <Animated.View
      testID="map-sheet"
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: open + bottomInset,
          backgroundColor: colors.ghee,
          borderTopLeftRadius: radius.sheet,
          borderTopRightRadius: radius.sheet,
          paddingHorizontal: space.xl,
          paddingBottom: bottomInset,
          borderTopWidth: 1,
          borderColor: colors.line,
        },
        style,
      ]}
    >
      <GestureDetector gesture={pan}>
        <View accessibilityRole="adjustable" accessibilityLabel={t('sheet.handle')} style={{ height: 32, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: colors.line }} />
        </View>
      </GestureDetector>
      <View style={{ flex: 1, gap: space.md }}>{children}</View>
    </Animated.View>
  );
}
