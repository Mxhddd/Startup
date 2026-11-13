// Over the top of the parent's map (v6): one chip per child (the chosen one dark) and the menu, on
// frosted glass. The language switch lives on the menu page, so the bar never overflows a small phone. Chips cross-fade their colour when you switch child, with a light tick you can feel.
import { colors, radius, space, useLang } from '@pohnch/ui';
import { AppText, ArchAvatar, Glass, Icon, PressableScale } from '@pohnch/ui/native';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

// v10: the same colours as the menu's portraits (red is only for help, never a child).
const looks = [() => ({ fill: colors.kesar, ink: colors.onKesar }), () => ({ fill: colors.zamurrad, ink: colors.onFill }), () => ({ fill: colors.neel, ink: colors.onBrand })];

function ChildChip({ name, on, i, onPress }: { name: string; on: boolean; i: number; onPress: () => void }) {
  const { dir } = useLang();
  const v = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    v.value = withTiming(on ? 1 : 0, { duration: 220 });
  }, [on, v]);
  // The chosen chip's dark face fades in over the glass.
  const dark = useAnimatedStyle(() => ({ opacity: v.value }));
  return (
    <PressableScale accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={name} onPress={onPress} scaleTo="chip" haptic="tick" testID={`child-chip-${i}`}>
      <Glass style={{ height: 44, paddingHorizontal: 8, paddingStart: dir === 'rtl' ? 8 : 8, borderRadius: radius.pill, borderCurve: 'continuous', flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 10 }}>
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: radius.pill, borderCurve: 'continuous', backgroundColor: colors.night }, dark]} />
        <View style={{ marginTop: -2 }}>
          <ArchAvatar letter={name.slice(0, 1)} size={28} color={looks[i % looks.length]!().fill} ink={looks[i % looks.length]!().ink} />
        </View>
        <AppText bold color={on ? colors.onBrand : colors.siyahi} style={{ fontSize: 16, paddingHorizontal: 6 }}>
          {name}
        </AppText>
      </Glass>
    </PressableScale>
  );
}

export function TopBar({
  top,
  kids,
  selected,
  onSelect,
  onMenu,
  onMenuLong,
}: {
  top: number;
  kids: { id: string; first_name: string }[];
  selected: string | null;
  onSelect: (id: string) => void;
  onMenu: () => void;
  onMenuLong?: () => void;
}) {
  const { t, dir } = useLang();
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  return (
    <Animated.View entering={FadeInUp.delay(120).springify().damping(22).stiffness(300)} style={{ position: 'absolute', top: top + space.md, left: space.gutter, right: space.gutter, flexDirection: row, alignItems: 'center', gap: space.sm }}>
      {kids.map((k, i) => (
        <ChildChip key={k.id} name={k.first_name} on={k.id === selected} i={i} onPress={() => onSelect(k.id)} />
      ))}
      <View style={{ flex: 1 }} />
      <PressableScale accessibilityRole="button" accessibilityLabel={t('parent.menu')} onPress={onMenu} onLongPress={onMenuLong} scaleTo="chip" testID="menu">
        <Glass style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="menu" size={20} color={colors.siyahi} strokeWidth={2.4} />
        </Glass>
      </PressableScale>
    </Animated.View>
  );
}
