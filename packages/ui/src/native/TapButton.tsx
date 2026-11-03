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
import { View } from 'react-native';
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
import { haptic } from './haptics';
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

function look(tone: Tone) {
  if (tone === 'neutral') return { fill: colors.white, text: colors.neel, border: colors.neel, lip: null };
  if (tone === 'quiet') return { fill: colors.sand, text: colors.siyahi, border: null, lip: null };
  if (tone === 'help') return { fill: colors.shingarf, text: colors.white, border: null, lip: lips.help };
  return { ...stepColors[tone], border: null, lip: lips[tone] };
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
}) {
  const { t, dir } = useLang();
  const c = look(tone);
  const big = size === 'next';
  const progress = useSharedValue(0);
  const pop = useSharedValue(1);
  const [holding, setHolding] = useState(false);
  // Keep the latest onConfirm without rebuilding the hold timer.
  const confirmRef = useRef(onConfirm);
  confirmRef.current = onConfirm;

  const celebrate = () => {
    haptic.success();
    pop.value = withSequence(withTiming(1.025, { duration: 90 }), withSpring(1, springs.pop));
  };

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
      if (prev !== null && q > prev && q > 0 && q < 4) runOnJS(haptic.tick)();
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
        lip={c.lip && !disabled ? { color: c.lip, depth: big ? 5 : 4 } : undefined}
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
          minHeight: big ? Math.max(tap.next, 108) : tap.min,
          borderRadius: big ? radius.big : radius.card,
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
        <View style={{ flexDirection: row, alignItems: 'center', gap: 14, paddingHorizontal: big ? 18 : 16 }}>
          {icon ? (
            big ? (
              <View style={{ width: 64, height: 64, borderRadius: radius.tile, backgroundColor: tone === 'reachedSchool' ? colors.siyahi : colors.ghee, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={icon} size={36} color={disabled ? colors.absentText : tone === 'reachedSchool' ? colors.kesar : c.fill} strokeWidth={2.3} />
              </View>
            ) : (
              <Icon name={icon} size={24} color={text} />
            )
          ) : null}
          <View style={{ flex: 1, paddingVertical: big ? 10 : 6 }}>
            <AppText bold color={text} style={{ fontSize: big ? 22 : 17 }} align={!icon ? 'center' : undefined}>
              {holding ? t('tap.holding') : label}
            </AppText>
            {sub ? (
              <AppText variant={big ? 'body' : 'small'} bold color={text} style={{ opacity: 0.92 }} align={!icon ? 'center' : undefined}>
                {sub}
              </AppText>
            ) : null}
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}
