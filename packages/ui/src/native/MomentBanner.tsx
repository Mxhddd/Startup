// The moment a step happens while the parent is watching: a coloured disc pops in at the top of the
// sheet with the step's icon, and either a ring closes around it (in the van, home) or a burst of
// kesar stars flies out of it (reached school). It speaks the step, then lets the sheet settle.
import { MOMENTS, type MomentStep } from '@pohnch/core';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, FadeOutUp, ZoomIn, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useLang } from '../lang';
import { springs } from '../motion';
import { colors, type Step } from '../theme';
import { AppText } from './AppText';
import { haptic } from './haptics';
import { Icon, StarIcon } from './icons';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const TONE = { neel: colors.neel, zamurrad: colors.zamurrad, kesar: colors.kesar, shingarf: colors.shingarf } as const;
const ICON: Record<MomentStep, Step | 'help'> = {
  left: 'left', picked: 'picked', arriving: 'dropped', reached_school: 'reachedSchool', left_school: 'leftSchool', dropped: 'dropped', late: 'help',
};

function Particle({ i, n, t }: { i: number; n: number; t: SharedValue<number> }) {
  const angle = (i / n) * Math.PI * 2;
  const dist = 46 + (i % 3) * 16;
  const size = 10 + (i % 3) * 4;
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.12 ? t.value / 0.12 : 1 - t.value,
    transform: [{ translateX: Math.cos(angle) * dist * t.value }, { translateY: Math.sin(angle) * dist * t.value }, { rotate: `${t.value * 160}deg` }, { scale: 0.3 + 0.7 * t.value }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 28 - size / 2, top: 28 - size / 2 }, style]}>
      <StarIcon size={size} color={colors.kesar} />
    </Animated.View>
  );
}

export function MomentBanner({ step, title, sub, onDone }: { step: MomentStep; title: string; sub?: string; onDone?: () => void }) {
  const { dir } = useLang();
  const m = MOMENTS[step];
  const fill = TONE[m.tone];
  const ink = m.tone === 'kesar' ? colors.siyahi : colors.white;
  const t = useSharedValue(0);
  const ring = useSharedValue(0);

  useEffect(() => {
    haptic[m.haptic]();
    t.value = withDelay(120, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
    ring.value = withDelay(150, withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }));
    const id = setTimeout(() => onDone?.(), 3800);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: 176 * (1 - ring.value) }));
  const stepKey = ICON[step];
  return (
    <Animated.View
      testID="moment-banner"
      accessibilityLiveRegion="assertive"
      entering={ZoomIn.springify().damping(springs.pop.damping).stiffness(springs.pop.stiffness)}
      exiting={FadeOutUp.duration(260)}
      style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 16 }}
    >
      <View style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}>
        {m.celebrate === 'burst' ? Array.from({ length: 10 }, (_, i) => <Particle key={i} i={i} n={10} t={t} />) : null}
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: fill, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={stepKey === 'help' ? 'help' : stepKey} size={26} color={ink} strokeWidth={2.4} />
        </View>
        {m.celebrate === 'ring' ? (
          <Svg width={64} height={64} viewBox="0 0 64 64" style={{ position: 'absolute', left: -4, top: -4, transform: [{ rotate: '-90deg' }] }}>
            <AnimatedCircle cx="32" cy="32" r="28" stroke={fill} strokeOpacity={0.4} strokeWidth={3} fill="none" strokeDasharray="176 176" animatedProps={ringProps} strokeLinecap="round" />
          </Svg>
        ) : null}
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant={step === 'late' ? 'headline' : 'display'} style={{ fontSize: step === 'late' ? 22 : 28 }} color={step === 'late' ? colors.dangerText : colors.siyahi}>
          {title}
        </AppText>
        {sub ? <AppText variant="small" bold color={colors.ink2}>{sub}</AppText> : null}
      </View>
    </Animated.View>
  );
}

