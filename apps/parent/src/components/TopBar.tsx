// Over the top of the parent's map (v5): one chip per child (the chosen one dark), the language switch
// and the menu. Chips cross-fade their colour when you switch child, with a light tick you can feel.
import { colors, radius, shadow, space, useLang } from '@pohnch/ui';
import { AppText, Icon, LangSwitch, PressableScale } from '@pohnch/ui/native';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { FadeInUp, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const dots = [colors.neel, colors.zamurrad, colors.kesar, colors.shingarf];

function ChildChip({ name, on, i, onPress }: { name: string; on: boolean; i: number; onPress: () => void }) {
  const { dir } = useLang();
  const v = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    v.value = withTiming(on ? 1 : 0, { duration: 220 });
  }, [on, v]);
  const bg = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(v.value, [0, 1], [colors.white, colors.siyahi]) }));
  return (
    <PressableScale accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={name} onPress={onPress} scaleTo="chip" haptic="tick" testID={`child-chip-${i}`}>
      <Animated.View style={[{ height: 40, paddingHorizontal: 12, borderRadius: radius.pill, flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, boxShadow: shadow.float }, bg]}>
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: dots[i % dots.length], alignItems: 'center', justifyContent: 'center' }}>
          <AppText bold color={i % dots.length === 2 ? colors.siyahi : colors.white} style={{ fontSize: 14, lineHeight: 18 }}>
            {name.slice(0, 1)}
          </AppText>
        </View>
        <AppText bold color={on ? colors.ghee : colors.siyahi} style={{ fontSize: 15 }}>
          {name}
        </AppText>
      </Animated.View>
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
    <Animated.View entering={FadeInUp.delay(120).springify().damping(22)} style={{ position: 'absolute', top: top + space.md, left: space.lg, right: space.lg, flexDirection: row, alignItems: 'center', gap: space.sm }}>
      {kids.map((k, i) => (
        <ChildChip key={k.id} name={k.first_name} on={k.id === selected} i={i} onPress={() => onSelect(k.id)} />
      ))}
      <View style={{ flex: 1 }} />
      <LangSwitch tone="float" />
      <PressableScale accessibilityRole="button" accessibilityLabel={t('parent.menu')} onPress={onMenu} onLongPress={onMenuLong} scaleTo="chip" testID="menu"
        faceStyle={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', boxShadow: shadow.float }}>
        <Icon name="menu" size={20} color={colors.siyahi} strokeWidth={2.4} />
      </PressableScale>
    </Animated.View>
  );
}
