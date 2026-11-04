// Reorder stops by dragging (v8, canvas "Z8D-Stops"). Press and hold a row (0.2 s), feel a bump, then
// drag it up or down; the other rows slide out of its way on a spring, with a tick at each new place.
// Let go and the order is handed back. Rows are a fixed 72 px, so positions are simple arithmetic.
import { moveId } from '@pohnch/core';
import { colors, radius, shadow, space, springs, useLang } from '@pohnch/ui';
import { AppText, Icon, feel } from '@pohnch/ui/native';
import { useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';

const H = 72;
export type DragItem = { id: string; label: string; sub?: string };

function Row({ item, order, onDrop }: { item: DragItem; order: SharedValue<string[]>; onDrop: (ids: string[]) => void }) {
  const { t, dir } = useLang();
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  const y = useSharedValue(order.value.indexOf(item.id) * H);
  const start = useSharedValue(0);
  const lifted = useSharedValue(0);
  const [n, setN] = useState(order.value.indexOf(item.id) + 1);

  // When another row pushes this one, slide to its new place; and keep the number in step.
  useAnimatedReaction(
    () => order.value.indexOf(item.id),
    (i, prev) => {
      if (i === prev) return;
      if (lifted.value === 0) y.value = withSpring(i * H, springs.layout);
      runOnJS(setN)(i + 1);
    },
  );

  const pan = Gesture.Pan()
    .activateAfterLongPress(200)
    .onStart(() => {
      start.value = y.value;
      lifted.value = withTiming(1, { duration: 120 });
      runOnJS(feel)('press');
    })
    .onUpdate((e) => {
      const max = (order.value.length - 1) * H;
      y.value = Math.max(-12, Math.min(max + 12, start.value + e.translationY));
      const to = Math.max(0, Math.min(order.value.length - 1, Math.round(y.value / H)));
      if (to !== order.value.indexOf(item.id)) {
        order.value = moveId(order.value, item.id, to);
        runOnJS(feel)('tick');
      }
    })
    .onFinalize(() => {
      lifted.value = withTiming(0, { duration: 180 });
      y.value = withSpring(order.value.indexOf(item.id) * H, springs.layout);
      runOnJS(onDrop)(order.value);
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { scale: 1 + lifted.value * 0.03 }],
    zIndex: lifted.value > 0 ? 10 : 1,
    opacity: 1 - lifted.value * 0.04,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View testID={`drag-${item.id}`} accessibilityLabel={`${n}. ${item.label}. ${t('driver.stops.dragHint')}`}
        style={[{ position: 'absolute', left: 0, right: 0, height: H - 8, boxShadow: shadow.card, borderRadius: radius.card, borderCurve: 'continuous', backgroundColor: colors.white, flexDirection: row, alignItems: 'center', gap: space.md, paddingHorizontal: space.md }, style]}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.neel, alignItems: 'center', justifyContent: 'center' }}>
          <AppText variant="number" color={colors.white} style={{ fontSize: 16, lineHeight: 20 }}>{String(n)}</AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText bold numberOfLines={1} style={{ fontSize: 18 }}>{item.label}</AppText>
          {item.sub ? <AppText variant="small" color={colors.ink2} numberOfLines={1}>{item.sub}</AppText> : null}
        </View>
        <Icon name="grip" size={24} color={colors.ink2} strokeWidth={3.4} />
      </Animated.View>
    </GestureDetector>
  );
}

export function DragList({ items, onChange }: { items: DragItem[]; onChange: (ids: string[]) => void }) {
  const order = useSharedValue(items.map((i) => i.id));
  return (
    <View testID="drag-list" style={{ height: items.length * H }}>
      {items.map((item) => (
        <Row key={item.id} item={item} order={order} onDrop={onChange} />
      ))}
    </View>
  );
}
