// One step in the parent's timeline: the step's colour and icon, what happened, who marked it, and when.
// Steps come in one after another; the step the van is on now breathes with a soft halo; a step that
// just happened pops its colour in.
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  LinearTransition,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useLang } from '../lang';
import { durations, springs, staggerDelay } from '../motion';
import { colors, stepColors, type Step } from '../theme';
import { AppText } from './AppText';
import { Icon } from './icons';

export function TimelineEvent({
  step,
  time,
  by,
  last = false,
  pending = false,
  current = false,
  index = 0,
}: {
  step: Step;
  time?: string;
  /** Who marked it ("Rafiq bhai"), or undefined when the map marked it ("arriving"). */
  by?: string;
  last?: boolean;
  pending?: boolean;
  /** The next step to happen: shown with a breathing ring. */
  current?: boolean;
  index?: number;
}) {
  const { t, dir } = useLang();
  const c = stepColors[step];
  const meta = by ? t('timeline.by', { who: by }) : t('timeline.auto');
  const row = dir === 'rtl' ? 'row-reverse' : 'row';

  // The colour pops in when a step happens while you watch.
  const filled = useSharedValue(pending ? 0 : 1);
  useEffect(() => {
    filled.value = pending ? withTiming(0, { duration: durations.fade }) : withSpring(1, springs.pop);
  }, [pending, filled]);
  const fillStyle = useAnimatedStyle(() => ({ opacity: filled.value, transform: [{ scale: 0.5 + 0.5 * filled.value }] }));

  // The line to the next step draws itself downward, just after this step arrives.
  const drawn = useSharedValue(0);
  useEffect(() => {
    drawn.value = withDelay(staggerDelay(index) + 180, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
  }, [drawn, index]);
  const lineStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: drawn.value }] }));

  const halo = useSharedValue(0);
  useEffect(() => {
    if (current) halo.value = withRepeat(withTiming(1, { duration: durations.pulse, easing: Easing.inOut(Easing.sin) }), -1, true);
    else {
      cancelAnimation(halo);
      halo.value = 0;
    }
  }, [current, halo]);
  const haloStyle = useAnimatedStyle(() => ({ opacity: current ? 0.35 - halo.value * 0.2 : 0, transform: [{ scale: 1 + halo.value * 0.45 }] }));

  return (
    <Animated.View
      testID={`timeline-${step}`}
      entering={FadeInDown.delay(staggerDelay(index)).springify().damping(springs.layout.damping).stiffness(springs.layout.stiffness)}
      layout={LinearTransition.springify().damping(springs.layout.damping)}
      style={{ flexDirection: row, gap: 16, minHeight: 70 }}
    >
      <View style={{ alignItems: 'center', width: 34 }}>
        <View style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={[{ position: 'absolute', width: 34, height: 34, borderRadius: 17, borderCurve: 'continuous', backgroundColor: colors.neel }, haloStyle]} />
          <View style={{ position: 'absolute', width: 34, height: 34, borderRadius: 17, borderCurve: 'continuous', backgroundColor: colors.white, borderWidth: current ? 4 : 2.5, borderColor: current ? colors.neel : step === 'reachedSchool' ? colors.kesar : colors.line }} />
          <Animated.View style={[{ position: 'absolute', width: 34, height: 34, borderRadius: 17, borderCurve: 'continuous', backgroundColor: c.fill }, fillStyle]} />
          <Icon name={step} size={18} color={pending ? (current ? colors.neel : colors.ink2) : c.text} strokeWidth={2.4} />
        </View>
        {!last ? <Animated.View style={[{ flex: 1, width: 3, borderRadius: 2, borderCurve: 'continuous', backgroundColor: pending ? colors.line : c.fill, marginVertical: 5, transformOrigin: 'top' }, lineStyle]} /> : null}
      </View>
      <View style={{ flex: 1, paddingBottom: 12, paddingTop: 2 }}>
        <AppText bold color={pending && !current ? colors.ink2 : colors.siyahi}>
          {t(`step.${step}`)}
        </AppText>
        {!pending ? <AppText variant="small" color={colors.ink2}>{meta}</AppText> : null}
      </View>
      {time ? (
        <AppText variant="number" color={pending ? colors.ink2 : colors.siyahi} style={{ fontSize: 15, lineHeight: 22, paddingTop: 2 }}>
          {time}
        </AppText>
      ) : null}
    </Animated.View>
  );
}
