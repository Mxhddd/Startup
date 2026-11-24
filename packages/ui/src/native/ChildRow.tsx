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
import { colors, radius, tap, type Step } from '../theme';
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
    <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, borderCurve: 'continuous', backgroundColor: fill, alignItems: 'center', justifyContent: 'center' }, circle]}>
      <Svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="none">
        <AnimatedPath d={TICK} stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${TICK_LEN} ${TICK_LEN}`} animatedProps={props} />
      </Svg>
    </Animated.View>
  );
}

/** v24 (the Beaconhouse demo): the route-dots column, a numbered dot joined to the stop above by a line,
 *  solid zamurrad once that stop is done, dotted while it is still ahead. */
function StopDot({ n, state, first, current = false }: { n: number; state: ChildRowState; first: boolean; current?: boolean }) {
  const done = state === 'done';
  const line = done ? colors.zamurrad : colors.line;
  return (
    <View style={{ width: 34, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' }}>
      {!first ? (
        <View style={{ position: 'absolute', top: -12, height: '50%', width: 3, alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' }}>
          {done ? <View style={{ flex: 1, width: 3, borderRadius: 2, backgroundColor: line }} /> : Array.from({ length: 6 }, (_, i) => <View key={i} style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: line }} />)}
        </View>
      ) : null}
      <View style={{ width: 30, height: 30, borderRadius: 15, borderCurve: 'continuous', borderWidth: 3, alignItems: 'center', justifyContent: 'center',
        borderColor: done ? colors.zamurrad : current ? colors.neel : state === 'absent' ? colors.line : colors.line,
        backgroundColor: done ? colors.zamurrad : current ? colors.neel : colors.ghee,
        boxShadow: current ? '0px 0px 0px 6px rgba(31,42,92,0.12)' : undefined }}>
        <AppText variant="number" color={done || current ? colors.onFill : colors.ink2} style={{ fontSize: 14, lineHeight: 18 }}>{String(n)}</AppText>
      </View>
    </View>
  );
}

/** The state pill at the row's end ("Picked", "Absent"), the demo's .st chips. */
function StatePill({ text, tone }: { text: string; tone: 'in' | 'off' }) {
  return (
    <View style={{ borderRadius: radius.pill, borderCurve: 'continuous', paddingHorizontal: 11, paddingVertical: 4, backgroundColor: tone === 'in' ? colors.zamurradTint : colors.sand }}>
      <AppText variant="small" bold color={tone === 'in' ? colors.zamurradOnTint : colors.absentText}>{text}</AppText>
    </View>
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
        <StopDot n={order ?? index + 1} state={state} first={index === 0} />
        <View style={{ flex: 1 }}>
          <AppText bold style={{ fontSize: 19 }} color={state === 'absent' ? colors.absentText : colors.siyahi}>{joined}</AppText>
          {stop ? <AppText variant="small" color={colors.ink2}>{stop}</AppText> : null}
        </View>
        {state === 'absent' ? <StatePill tone="off" text={t('chutti.label')} /> : time ? <AppText variant="number" style={{ fontSize: 15, lineHeight: 20 }} color={colors.ink2}>{time}</AppText> : null}
      </Animated.View>
    );
  }

  // The trip's other stops (v24, the demo's route dots): flat rows on the sheet joined by the route line,
  // the stop's number in the dot, a pill once it is done or the child is off today, and a 64 px tap.
  const done = state === 'done';
  return (
    <Animated.View testID={testID} entering={enter} layout={layout} style={{ flexDirection: row, alignItems: 'center', gap: 12, minHeight: tap.min, paddingVertical: 4 }}>
      <StopDot n={order ?? index + 1} state={state} first={index === 0} />
      <View style={{ flex: 1 }}>
        <AppText bold style={{ fontSize: 19 }} color={state === 'absent' ? colors.absentText : colors.siyahi}>
          {joined}
        </AppText>
        {stop ? <AppText variant="small" color={colors.ink2}>{stop}</AppText> : null}
      </View>
      {done ? <StatePill tone="in" text={t(`step.${step}`)} /> : null}
      {state === 'absent' ? <StatePill tone="off" text={t('chutti.label')} /> : null}
      {state === 'waiting' ? (
        <View style={{ width: 132 }}>
          <TapButton size="later" tone={step} label={t(`tap.${step}.short`)} onConfirm={onTap} />
        </View>
      ) : null}
    </Animated.View>
  );
}
