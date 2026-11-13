// The driver's tap (and the main button everywhere else). The next expected tap is the one big button
// (104 px and up); every other tap is at least 64 px.
//
// How it moves:
// - The face sinks into its darker "lip" on a firm spring and springs back up when let go.
// - Van-wide taps use hold={true}: a light fill sweeps across from the reading start in 0.8 s, with a
//   soft tick at each quarter you can feel; only a full hold confirms. Let go early and the fill
//   springs back.
// - On confirm the button gives one small "pop" and a success haptic.
// v10 "Jharoka": every face has depth: it shades from a lighter top to its colour, carries a 1 px
// highlight along the top edge, and stands on its lip. The neutral tone is no longer a bordered white
// box but a soft neel-tint face; quiet is sand on a sand lip. Big buttons hold their icon in a soft
// circle instead of a square tile.
import { HOLD_MS } from '@pohnch/core';
import { useRef, useState } from 'react';
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
import { colors, elevation, radius, radius10, stepColors, tap, type Step } from '../theme';
import { AppText } from './AppText';
import { Gradient } from './Gradient';
import { HOLD_FEELS, type FeelKind } from '../feedbackTable';
import { feel as feelIt } from './feedback';
import { Icon, type IconName } from './icons';
import { PressableScale } from './PressableScale';

type Tone = Step | 'neutral' | 'help' | 'quiet';

// v21: read when drawing (they were copied once at load, so dark mode kept the day colours).
const lipOf = (k: Step | 'help'): string =>
  ({ left: colors.neelDeep, leftSchool: colors.neelDeep, picked: colors.zamurradDeep, dropped: colors.zamurradDeep, reachedSchool: colors.kesarDeep, help: colors.shingarfDeep })[k];
const glowOf = (k: Step): string =>
  ({ left: colors.neelGlow, leftSchool: colors.neelGlow, picked: colors.zamurradGlow, dropped: colors.zamurradGlow, reachedSchool: colors.kesarGlow })[k];

// Read when drawing (not at load), so the night palette's tops apply too.
const tops = (k: Step | 'help'): string =>
  ({ left: colors.neelHi, leftSchool: colors.neelHi, picked: colors.zamurradHi, dropped: colors.zamurradHi, reachedSchool: colors.kesarHi, help: colors.shingarfHi })[k];

type Look = { fill: string; top: string; text: string; lip: string | null; glow: string | null; ring: string; hi: number };

function look(tone: Tone): Look {
  if (tone === 'neutral') return { fill: colors.neelTint, top: colors.neelTint, text: colors.link, lip: colors.neelTint2, glow: null, ring: colors.white, hi: 0.7 };
  if (tone === 'quiet') return { fill: colors.sand, top: colors.sand, text: colors.siyahi, lip: colors.sandDeep, glow: null, ring: colors.white, hi: 0.7 };
  if (tone === 'help') return { fill: colors.shingarf, top: tops('help'), text: colors.white, lip: lipOf('help'), glow: null, ring: 'rgba(255,255,255,0.16)', hi: 0.16 };
  return { ...stepColors[tone], top: tops(tone), lip: lipOf(tone), glow: glowOf(tone), ring: tone === 'reachedSchool' ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.16)', hi: tone === 'reachedSchool' ? 0.35 : 0.16 };
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
  /** v21: may return a promise; the button then waits (and can't be tapped twice) until it settles. */
  onConfirm: () => unknown;
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
  const [busy, setBusy] = useState(false);
  // Keep the latest onConfirm without rebuilding anything.
  const confirmRef = useRef(onConfirm);
  confirmRef.current = onConfirm;
  const holdingRef = useRef(false);

  const celebrate = () => {
    feelIt(confirmFeel);
    pop.value = withSequence(withTiming(1.03, { duration: 90 }), withSpring(1, springs.pop));
    shine.value = 0;
    shine.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
  };

  // v21: the action runs in the same frame as the feedback. A promise keeps the button busy (no double taps).
  const fire = () => {
    celebrate();
    const r = confirmRef.current();
    if (r && typeof (r as Promise<unknown>).then === 'function') {
      setBusy(true);
      (r as Promise<unknown>).catch(() => undefined).finally(() => setBusy(false));
    }
  };

  // A rising tick at each quarter of the hold (sound and touch), so the driver hears it filling.
  const holdTick = (q: number) => feelIt(HOLD_FEELS[q - 1] ?? 'hold1');

  // v21: the hold confirms when the fill itself finishes (on the UI thread), not from a separate JS timer
  // that could run late while the phone is busy. The fill and the confirm are now one and the same.
  const holdDone = () => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    setHolding(false);
    progress.value = withTiming(0, { duration: 200 });
    fire();
  };

  // A soft tick at each quarter of the hold, so the driver feels it filling without looking.
  useAnimatedReaction(
    () => Math.floor(progress.value * 4),
    (q, prev) => {
      if (prev !== null && q > prev && q > 0 && q < 4) runOnJS(holdTick)(q);
    },
  );

  const start = () => {
    if (!hold || disabled || busy) return;
    holdingRef.current = true;
    setHolding(true);
    progress.value = withTiming(1, { duration: HOLD_MS, easing: Easing.inOut(Easing.quad) }, (fin) => {
      if (fin) runOnJS(holdDone)();
    });
  };

  const cancel = () => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    setHolding(false);
    cancelAnimation(progress);
    progress.value = withSpring(0, springs.release);
  };

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%`, opacity: progress.value > 0 ? 1 : 0 }));
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  const off = disabled || busy;
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
        accessibilityState={{ disabled: off, busy }}
        disabled={off}
        scaleTo={big ? 'big' : 'small'}
        haptic={big || hold ? 'press' : 'tap'}
        lip={c.lip && !disabled ? { color: c.lip, depth: big ? 6 : 4 } : undefined}
        glow={big && c.glow ? c.glow : undefined}
        onLayout={(e: LayoutChangeEvent) => {
          const w = Math.round(e.nativeEvent.layout.width);
          if (w !== width) setWidth(w);
        }}
        onPress={hold ? undefined : fire}
        onPressIn={start}
        onPressOut={cancel}
        faceStyle={{
          minHeight: big ? Math.max(tap.next, 120) : tap.min,
          borderRadius: big ? radius.big : radius10.field, borderCurve: 'continuous',
          backgroundColor: fill,
          boxShadow: disabled ? undefined : elevation.highlight(c.hi),
          opacity: busy ? 0.75 : 1,
          overflow: 'hidden',
          justifyContent: 'center',
        }}
      >
        {/* v10/v11: the face shades from a lighter top to its colour (drawn with svg, so it shows on the web too). */}
        {!disabled && c.top !== c.fill ? <Gradient stops={[[0, c.top], [1, c.fill]]} /> : null}
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
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: disabled ? colors.sand : c.ring, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={icon} size={34} color={text} strokeWidth={2.4} />
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
