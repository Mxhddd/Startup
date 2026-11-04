// v11 (canvas "Z11P-Moment"): a trip step as an arch of light. When a step happens while you watch
// (in the van, at school, home, at your door), an arch in the step's colour rises in the middle of
// the screen, light pours out of it, the child's initial rises inside, small stars arc over, the words
// appear under it in Gulzar, and after a moment it all settles away. Tap to dismiss early. The sound
// and haptic come from the sheet's moment (feedback.ts), so they're not played twice.
// Reduce Motion: the arch and words fade in and out, no rays or travel.
import { useEffect } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { colors } from '../theme';
import { AppText } from './AppText';
import { ArchShape } from './Arch';
import { Gradient } from './Gradient';
import { StarIcon } from './icons';

export type ArchMomentTone = 'neel' | 'zamurrad' | 'kesar';

const STARS = [[-110, -90], [-60, -140], [0, -165], [60, -140], [110, -90], [-140, -30], [140, -30]] as const;

function Star({ i, t }: { i: number; t: SharedValue<number> }) {
  const [x, y] = STARS[i] as readonly [number, number];
  const s = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, (t.value - 0.15 - i * 0.03) / 0.5));
    const e = 1 - (1 - p) ** 3;
    return { opacity: p > 0 ? Math.min(1, p * 3) * (t.value > 1.6 ? 0 : 1) : 0, transform: [{ translateX: x * e }, { translateY: y * e }, { rotate: `${e * 180}deg` }, { scale: 0.3 + 0.7 * e }] };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left: -8, top: -8 }, s]}>
      <StarIcon size={i % 2 ? 16 : 12} color={colors.kesar} />
    </Animated.View>
  );
}

export function ArchMoment({ visible, tone, letter, title, sub, onDone }: { visible: boolean; tone: ArchMomentTone; letter: string; title: string; sub?: string; onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const reduce = useReducedMotion();
  const t = useSharedValue(0); // 0 -> 1 rising, held, then 2 = gone
  const fill = tone === 'kesar' ? colors.kesar : tone === 'zamurrad' ? colors.zamurrad : colors.neel;
  const ink = tone === 'kesar' ? colors.onKesar : colors.onFill;
  const glow = tone === 'kesar' ? '#F6CF8E' : tone === 'zamurrad' ? '#78DCB4' : '#9DAAF0';

  // v12: the light beats with the step's tone (three soft pulses as its notes play).
  const beat = useSharedValue(0);
  useEffect(() => {
    if (!visible) return;
    if (!reduce) {
      const pulse = () => withSequence(withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 260, easing: Easing.in(Easing.quad) }));
      beat.value = 0;
      beat.value = withDelay(260, withSequence(pulse(), pulse(), pulse()));
    }
    t.value = 0;
    t.value = withSequence(
      withTiming(1, { duration: reduce ? 250 : 900, easing: Easing.out(Easing.cubic) }),
      withDelay(1500, withTiming(2, { duration: 420 }, (fin) => fin && runOnJS(onDone)())),
    );
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const wash = useAnimatedStyle(() => ({ opacity: t.value <= 1 ? t.value * 0.9 : 0.9 * (2 - t.value) }));
  const arch = useAnimatedStyle(() => {
    const out = t.value > 1 ? t.value - 1 : 0;
    if (reduce) return { opacity: t.value <= 1 ? t.value : 1 - out };
    const p = Math.min(1, t.value);
    const e = 1 - (1 - p) ** 3;
    return { opacity: Math.min(1, p * 2) * (1 - out), transform: [{ translateY: 60 * (1 - e) + 20 * out }, { scale: 0.6 + 0.4 * e - 0.1 * out }] };
  });
  const rays = useAnimatedStyle(() => ({ opacity: reduce ? 0 : Math.max(0, Math.min(0.9, (t.value - 0.2) * 1.5)) * (t.value > 1 ? 2 - t.value : 1), transform: [{ scale: (0.5 + 0.6 * Math.min(1, t.value)) * (1 + 0.14 * beat.value) }, { rotate: `${t.value * 18}deg` }] }));
  const words = useAnimatedStyle(() => ({ opacity: Math.max(0, Math.min(1, (t.value - 0.4) * 2)) * (t.value > 1 ? 2 - t.value : 1), transform: [{ translateY: 12 * (1 - Math.min(1, t.value)) }] }));

  if (!visible) return null;
  const aw = Math.min(200, width * 0.5);
  const ah = aw * 1.2;
  return (
    <Pressable accessibilityRole="alert" accessibilityLabel={`${title}${sub ? `. ${sub}` : ''}`} onPress={() => { t.value = withTiming(2, { duration: 200 }, (fin) => fin && runOnJS(onDone)()); }}
      style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: colors.ghee }, wash]} />
      <View style={{ alignItems: 'center', marginTop: -height * 0.08 }}>
        <View style={{ width: aw, height: ah, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: aw * 2.4, height: aw * 2.4 }, rays]}>
            <Gradient radial stops={[[0, glow, 0.85], [0.35, glow, 0.35], [1, glow, 0]]} />
          </Animated.View>
          <Animated.View style={[{ width: aw, height: ah, boxShadow: `0px 24px 40px -10px ${fill}` }, arch]}>
            <ArchShape width={aw} height={ah} rise={aw * 0.65} color={fill} />
            <View style={{ position: 'absolute', left: 0, right: 0, top: ah * 0.42, alignItems: 'center' }}>
              <AppText bold color={ink} style={{ fontSize: aw * 0.4, lineHeight: aw * 0.56 }}>{letter}</AppText>
            </View>
          </Animated.View>
          {!reduce ? <View style={{ position: 'absolute', left: aw / 2, top: ah * 0.5 }}>{STARS.map((_, i) => <Star key={i} i={i} t={t} />)}</View> : null}
        </View>
        <Animated.View style={[{ alignItems: 'center', marginTop: 18, paddingHorizontal: 24 }, words]}>
          <AppText variant="display" align="center" style={{ fontSize: 36 }}>{title}</AppText>
          {sub ? <AppText color={colors.ink2} align="center" style={{ fontSize: 16 }}>{sub}</AppText> : null}
        </Animated.View>
      </View>
    </Pressable>
  );
}
