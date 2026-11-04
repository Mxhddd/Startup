// The driver's tap (and the main button everywhere else). The next expected tap is the one big button
// (104 px and up); every other tap is at least 64 px.
//
// How it moves:
// - The face sinks into its darker "lip" on a firm spring and springs back up when let go.
// - Van-wide taps use hold={true}: a light fill sweeps across from the reading start in 0.8 s, with a
//   soft tick at each quarter you can feel; only a full hold confirms. Let go early and the fill
//   springs back.
// - On confirm the button gives one small "pop" and a success haptic.
import { HOLD_MS, createHold } from '@pohnch/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useLang } from '../lang';
import { springs } from '../motion';
import { colors, radius, stepColors, tap, type Step } from '../theme';
import { AppText } from './AppText';
import { HOLD_FEELS, type FeelKind } from '../feedbackTable';
import { feel as feelIt } from './feedback';
import { Icon, type IconName } from './icons';
import { PressableScale } from './PressableScale';

type Tone = Step | 'neutral' | 'help' | 'quiet';

const lips: Record<Step | 'help', string> = {
  left: colors.neelDeep,
  leftSchool: colors.neelDeep,
  picked: colors.zamurradDeep,
  dropped: colors.zamurradDeep,
  reachedSchool: colors.kesarDeep,
  help: colors.shingarfDeep,
};

const glows: Record<Step, string> = {
  left: colors.neelGlow,
  leftSchool: colors.neelGlow,
  picked: colors.zamurradGlow,
  dropped: colors.zamurradGlow,
  reachedSchool: colors.kesarGlow,
};

function look(tone: Tone) {
  if (tone === 'neutral') return { fill: colors.white, text: colors.link, border: colors.link, lip: null, glow: null };
  if (tone === 'quiet') return { fill: colors.sand, text: colors.siyahi, border: null, lip: null, glow: null };
  if (tone === 'help') return { fill: colors.shingarf, text: colors.white, border: null, lip: lips.help, glow: null };
  return { ...stepColors[tone], border: null, lip: lips[tone], glow: glows[tone] };
}

/** A soft band of light that sweeps across the button once, when a tap is confirmed. */
function Sheen({ width, progress, dir }: { width: number; progress: { value: number }; dir: 'rtl' | 'ltr' }) {
  const band = 90;
  const style = useAnimatedStyle(() => {
    const from = dir === 'rtl' ? width : -band;
    const to = dir === 'rtl' ? -band : width;
    return { opacity: progress.value > 0 && progress.value < 1 ? 1 : 0, transform: [{ translateX: from + (to - from) * progress.value }, { skewX: '-18deg' }] };
  });
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: -20, bottom: -20, left: 0, width: band }, style]}>
      <Svg width={band} height="100%">
        <Defs>
          <LinearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
            <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.38} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={band} height="100%" fill="url(#sheen)" />
      </Svg>
    </Animated.View>
  );
}

export function TapButton({
  label,
  sublabel,
  size = 'later',
  tone = 'neutral',
  icon,
  hold = false,
  disabled = false,
  onConfirm,
  testID,
  feel: confirmFeel = 'confirm',
}: {
  label: string;
  sublabel?: string;
  size?: 'next' | 'later';
  tone?: Tone;
  icon?: IconName;
  hold?: boolean;
  disabled?: boolean;
  onConfirm: () => void;
  testID?: string;
  /** v9: the sound and haptic when it confirms (a trip step plays its own tone). */
  feel?: FeelKind;
}) {
  const { t, dir } = useLang();
  const c = look(tone);
  const big = size === 'next';
  const progress = useSharedValue(0);
  const pop = useSharedValue(1);
  const shine = useSharedValue(0);
  const [width, setWidth] = useState(0);
  const [holding, setHolding] = useState(false);
  // Keep the latest onConfirm without rebuilding the hold timer.
  const confirmRef = useRef(onConfirm);
  confirmRef.current = onConfirm;

  const celebrate = () => {
    feelIt(confirmFeel);
    pop.value = withSequence(withTiming(1.03, { duration: 110 }), withSpring(1, springs.pop));
    shine.value = 0;
    shine.value = withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic) });
  };

  // A rising tick at each quarter of the hold (sound and touch), so the driver hears it filling.
  const holdTick = (q: number) => feelIt(HOLD_FEELS[q - 1] ?? 'hold1');

  const holdCtl = useMemo(
    () =>
      createHold(() => {
        setHolding(false);
        progress.value = withTiming(0, { duration: 260 });
        celebrate();
        confirmRef.current();
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [progress],
  );

  useEffect(() => () => {
    holdCtl.release();
  }, [holdCtl]);

  // A soft tick at each quarter of the hold, so the driver feels it filling without looking.
  useAnimatedReaction(
    () => Math.floor(progress.value * 4),
    (q, prev) => {
      if (prev !== null && q > prev && q > 0 && q < 4) runOnJS(holdTick)(q);
    },
  );

  const start = () => {
    if (!hold || disabled) return;
    setHolding(true);
    progress.value = withTiming(1, { duration: HOLD_MS, easing: Easing.inOut(Easing.quad) });
    holdCtl.press();
  };

  const cancel = () => {
    if (!holdCtl.release()) return;
    setHolding(false);
    cancelAnimation(progress);
    progress.value = withSpring(0, springs.release);
  };

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%`, opacity: progress.value > 0 ? 1 : 0 }));
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  const fill = disabled ? colors.absentBg : c.fill;
  const text = disabled ? colors.absentText : c.text;
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  const hint = hold && !holding ? t('tap.hold') : null;
  const sub = [sublabel, hint].filter(Boolean).join(' · ');

  return (
    <Animated.View style={popStyle}>
      <PressableScale
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={hold ? t('tap.hold') : undefined}
        accessibilityState={{ disabled }}
        disabled={disabled}
        scaleTo={big ? 'big' : 'small'}
        haptic={big || hold ? 'press' : 'tap'}
        lip={c.lip && !disabled ? { color: c.lip, depth: big ? 6 : 4 } : undefined}
        glow={big && c.glow ? c.glow : undefined}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        onPress={
          hold
            ? undefined
            : () => {
                celebrate();
                onConfirm();
              }
        }
        onPressIn={start}
        onPressOut={cancel}
        faceStyle={{
          minHeight: big ? Math.max(tap.next, 120) : tap.min,
          borderRadius: big ? radius.big : radius.button, borderCurve: 'continuous',
          backgroundColor: fill,
          borderWidth: c.border && !disabled ? 2 : 0,
          borderColor: c.border ?? undefined,
          overflow: 'hidden',
          justifyContent: 'center',
        }}
      >
        {hold ? (
          <Animated.View
            pointerEvents="none"
            style={[
              { position: 'absolute', top: 0, bottom: 0, backgroundColor: tone === 'reachedSchool' ? 'rgba(20,26,51,0.12)' : 'rgba(255,255,255,0.22)' },
              dir === 'rtl' ? { right: 0 } : { left: 0 },
              fillStyle,
            ]}
          />
        ) : null}
        {width > 0 ? <Sheen width={width} progress={shine} dir={dir} /> : null}
        <View style={{ flexDirection: row, alignItems: 'center', gap: 16, paddingHorizontal: big ? 20 : 16 }}>
          {icon ? (
            big ? (
              <View style={{ width: 72, height: 72, borderRadius: 24, borderCurve: 'continuous', backgroundColor: tone === 'reachedSchool' ? colors.night : colors.ghee, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={icon} size={38} color={disabled ? colors.absentText : tone === 'reachedSchool' ? colors.kesar : c.fill} strokeWidth={2.3} />
              </View>
            ) : (
              <Icon name={icon} size={24} color={text} />
            )
          ) : null}
          <View style={{ flex: 1, paddingVertical: big ? 12 : 6 }}>
            <AppText bold color={text} style={{ fontSize: big ? 24 : 17 }} align={!icon ? 'center' : undefined}>
              {holding ? t('tap.holding') : label}
            </AppText>
            {sub ? (
              <AppText variant={big ? 'body' : 'small'} bold color={text} style={{ opacity: 0.88, fontSize: big ? 15 : 14 }} align={!icon ? 'center' : undefined}>
                {sub}
              </AppText>
            ) : null}
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}
