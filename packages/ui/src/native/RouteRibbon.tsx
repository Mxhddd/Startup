// v12 RouteRibbon: the trip's steps as a row of small arches joined by route dots, in the sheet.
// Done steps are filled in their meaning's colour with a tick; the current one has a kesar rim that
// breathes; later ones are quiet outlines. Reads in the language's direction. One colour per meaning.
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useLang } from '../lang';
import { archPath, colors, stepColors, type Step } from '../theme';
import { AppText } from './AppText';
import { Icon } from './icons';

const W = 40;
const H = 48;

function Milestone({ step, label, done, current }: { step: Step; label: string; done: boolean; current: boolean }) {
  const v = useSharedValue(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (current && !reduce) v.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }), -1, true);
    else v.value = 0;
  }, [current, reduce, v]);
  const glow = useAnimatedStyle(() => ({ opacity: current ? 0.35 + 0.5 * v.value : 0, transform: [{ scale: 1 + 0.12 * v.value }] }));
  const c = stepColors[step];
  return (
    <View style={{ alignItems: 'center', gap: 4, width: 64 }} accessibilityLabel={label} accessibilityState={{ checked: done, selected: current }}>
      <View style={{ width: W, height: H }}>
        <Animated.View style={[{ position: 'absolute', left: -6, top: -7, width: W + 12, height: H + 12 }, glow]}>
          <Svg width={W + 12} height={H + 12}><Path d={archPath(W + 12, H + 12)} fill={colors.kesar} opacity={0.5} /></Svg>
        </Animated.View>
        <Svg width={W} height={H}>
          <Path d={archPath(W, H)} fill={done ? c.fill : colors.white} stroke={done ? c.fill : current ? colors.kesar : colors.line} strokeWidth={done ? 0 : 2.5} />
        </Svg>
        <View style={{ position: 'absolute', left: 0, right: 0, top: 18, alignItems: 'center' }}>
          <Icon name={done ? 'check' : step} size={18} color={done ? c.text : current ? colors.kesarText : colors.ink2} />
        </View>
      </View>
      <AppText bold color={done || current ? colors.siyahi : colors.ink2} align="center" style={{ fontSize: 14 }} numberOfLines={2}>{label}</AppText>
    </View>
  );
}

export function RouteRibbon({ steps, testID }: { steps: { step: Step; label: string; done: boolean }[]; testID?: string }) {
  const { dir } = useLang();
  const current = steps.findIndex((s) => !s.done);
  return (
    <View testID={testID} style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      {steps.map((s, i) => (
        <View key={s.step} style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'flex-start', flexGrow: i < steps.length - 1 ? 1 : 0, flexShrink: 1, minWidth: 0 }}>
          <Milestone step={s.step} label={s.label} done={s.done} current={i === current} />
          {i < steps.length - 1 ? (
            <View style={{ flex: 1, flexShrink: 1, minWidth: 0, height: H, justifyContent: 'space-evenly', alignItems: 'center', flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', overflow: 'hidden' }}>
              {Array.from({ length: 4 }, (_, k) => (
                <View key={k} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: s.done ? stepColors[s.step].fill : colors.line }} />
              ))}
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}
