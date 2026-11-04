// The moment a step happens while the parent is watching (v9): a coloured disc pops in at the top of
// the sheet with the step's icon; its tone and haptic play in the same frame (feel); and its picture is
// drawn on the GPU (MomentFX): a ring closes (in the van), kesar stars rise into a constellation
// (reached school), a warm glow swells and the ring closes (home). Then the sheet settles.
import { MOMENTS, type MomentStep } from '@pohnch/core';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, FadeOutUp, ZoomIn, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useLang } from '../lang';
import { springs } from '../motion';
import { colors, type Step } from '../theme';
import { AppText } from './AppText';
import { feel } from './feedback';
import { Icon } from './icons';
import { MomentFX } from './MomentFX';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const TONE = { neel: colors.neel, zamurrad: colors.zamurrad, kesar: colors.kesar, shingarf: colors.shingarf } as const;
const ICON: Record<MomentStep, Step | 'help'> = {
  left: 'left', picked: 'picked', arriving: 'dropped', reached_school: 'reachedSchool', left_school: 'leftSchool', dropped: 'dropped', late: 'help',
};


export function MomentBanner({ step, title, sub, onDone }: { step: MomentStep; title: string; sub?: string; onDone?: () => void }) {
  const { dir } = useLang();
  const m = MOMENTS[step];
  const fill = TONE[m.tone];
  const ink = m.tone === 'kesar' ? colors.onKesar : colors.onFill;
  const t = useSharedValue(0);
  const ring = useSharedValue(0);

  useEffect(() => {
    // v9: the step's own tone and haptic, with the picture.
    feel(step);
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
        {/* v9: the moment's picture on the GPU, behind the disc (stars, glow) or around it (ring). */}
        <View pointerEvents="none" style={{ position: 'absolute', left: 28, top: 28, width: 0, height: 0 }}>
          <MomentFX kind={step === 'dropped' ? 'glow' : m.celebrate} color={fill} />
        </View>
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: fill, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={stepKey === 'help' ? 'help' : stepKey} size={26} color={ink} strokeWidth={2.4} />
        </View>
        {step === 'dropped' ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: 28, top: 28, width: 0, height: 0 }}>
            <MomentFX kind="ring" color={fill} />
          </View>
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

