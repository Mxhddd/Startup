// One stop on the driver's list: the first names at that stop (siblings tap together), and its state.
// The next stop holds the big TapButton; other stops are 64 px rows.
//
// How it moves: rows come in one after another (index), slide to make room when one changes,
// and a done row draws its tick and turns zamurrad.
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, LinearTransition, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useLang } from '../lang';
import { springs, staggerDelay } from '../motion';
import { colors, radius, shadow, stepColors, tap, type Step } from '../theme';
import { AbsentChip } from './AbsentChip';
import { AppText } from './AppText';
import { TapButton } from './TapButton';

export type ChildRowState = 'waiting' | 'done' | 'absent';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const TICK = 'M6 12.5l4 4L18 8';
const TICK_LEN = 18;

/** A tick that draws itself, inside a circle that pops in. */
export function DrawnCheck({ color, size = 32, fill }: { color: string; size?: number; fill: string }) {
  const drawn = useSharedValue(0);
  const scale = useSharedValue(0.4);
  useEffect(() => {
    scale.value = withSpring(1, springs.pop);
    drawn.value = withDelay(80, withTiming(1, { duration: 260 }));
  }, [drawn, scale]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: TICK_LEN * (1 - drawn.value) }));
  const circle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: fill, alignItems: 'center', justifyContent: 'center' }, circle]}>
      <Svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="none">
        <AnimatedPath d={TICK} stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${TICK_LEN} ${TICK_LEN}`} animatedProps={props} />
      </Svg>
    </Animated.View>
  );
}

export function ChildRow({
  names,
  stop,
  step,
  state,
  isNext = false,
  onTap,
  testID,
  readOnly = false,
  order,
  time,
  index = 0,
}: {
  names: string[];
  stop: string;
  /** The step this tap records at this stop: picked in the morning, dropped in the afternoon. */
  step: Extract<Step, 'picked' | 'dropped'>;
  state: ChildRowState;
  isNext?: boolean;
  onTap: () => void;
  testID?: string;
  /** A preview of the list (Today screen): no buttons, tapping happens on the trip screen. */
  readOnly?: boolean;
  /** The stop's number on the route, and its time ("7:12"), shown on the Today list. */
  order?: number;
  time?: string;
  /** Position in the list, for the one-after-another entrance. */
  index?: number;
}) {
  const { t, dir, lang } = useLang();
  const joined = names.join(lang === 'ur' ? '، ' : ', ');
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  const enter = FadeInDown.delay(staggerDelay(index)).springify().damping(springs.layout.damping).stiffness(springs.layout.stiffness);
  const layout = LinearTransition.springify().damping(springs.layout.damping).stiffness(springs.layout.stiffness);

  if (isNext && state === 'waiting' && !readOnly) {
    return (
      <Animated.View testID={testID} entering={enter} layout={layout} style={{ gap: 8 }}>
        <AppText variant="small" bold color={colors.ink2}>
          {`${t('tap.next')} · ${stop}`}
        </AppText>
        <TapButton size="next" tone={step} icon={step} label={joined} sublabel={t(`step.${step}`)} onConfirm={onTap} testID={testID ? `${testID}-tap` : undefined} />
      </Animated.View>
    );
  }

  // The Today list: plain rows inside one white card, a number ring, names and the time.
  if (readOnly) {
    return (
      <Animated.View testID={testID} entering={enter} layout={layout} style={{ flexDirection: row, alignItems: 'center', gap: 12, minHeight: 52, paddingVertical: 6 }}>
        {state === 'absent' ? (
          <AbsentChip name={joined} />
        ) : (
          <>
            <View style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: colors.siyahi, alignItems: 'center', justifyContent: 'center' }}>
              <AppText variant="number" style={{ fontSize: 14, lineHeight: 18 }}>{String(order ?? index + 1)}</AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText bold style={{ fontSize: 17 }}>{joined}</AppText>
              {stop ? <AppText variant="small" color={colors.ink2}>{stop}</AppText> : null}
            </View>
            {time ? <AppText variant="number" style={{ fontSize: 15, lineHeight: 20 }} color={colors.ink2}>{time}</AppText> : null}
          </>
        )}
      </Animated.View>
    );
  }

  const done = state === 'done';
  return (
    <Animated.View
      testID={testID}
      entering={enter}
      layout={layout}
      style={{
        flexDirection: row,
        alignItems: 'center',
        gap: 12,
        minHeight: tap.min + 8,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: radius.card,
        backgroundColor: done ? colors.zamurradTint : colors.white,
        boxShadow: done ? undefined : shadow.card,
      }}
    >
      {done ? (
        <DrawnCheck fill={stepColors[step].fill} color={colors.white} />
      ) : (
        <View style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: state === 'absent' ? colors.line : colors.neel }} />
      )}
      <View style={{ flex: 1 }}>
        <AppText bold color={state === 'absent' ? colors.absentText : done ? colors.zamurradOnTint : colors.siyahi}>
          {joined}
        </AppText>
        <AppText variant="small" color={done ? colors.zamurradOnTint : colors.ink2}>
          {done ? t(`step.${step}`) : stop}
        </AppText>
      </View>
      {state === 'absent' ? <AbsentChip /> : null}
      {state === 'waiting' ? (
        <View style={{ width: 132 }}>
          <TapButton size="later" tone={step} label={t(`tap.${step}.short`)} onConfirm={onTap} />
        </View>
      ) : null}
    </Animated.View>
  );
}
