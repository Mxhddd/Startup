// After every tap: what was marked, a 5-second ring that empties, and Undo.
// It rises from the bottom on the sheet spring and sinks away when the time is up (or after Undo).
import { UNDO_MS, createUndoCountdown, undoSecondsLeft } from '@pohnch/core';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { Easing, FadeOutDown, SlideInDown, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useLang } from '../lang';
import { springs } from '../motion';
import { colors, radius, shadow, tap } from '../theme';
import { AppText } from './AppText';
import { haptic } from './haptics';
import { PressableScale } from './PressableScale';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const R = 15;
const C = 2 * Math.PI * R;

export function UndoBar({
  text,
  tappedAt,
  onUndo,
  onExpire,
  now = Date.now,
}: {
  text: string;
  tappedAt: number;
  onUndo: () => void;
  onExpire?: () => void;
  now?: () => number;
}) {
  const { t, dir } = useLang();
  const [left, setLeft] = useState(() => undoSecondsLeft(tappedAt, now()));
  const remaining = useSharedValue(Math.max(0, (tappedAt + UNDO_MS - now()) / UNDO_MS));

  useEffect(() => {
    remaining.value = withTiming(0, { duration: Math.max(0, tappedAt + UNDO_MS - now()), easing: Easing.linear });
    const countdown = createUndoCountdown(tappedAt, setLeft, () => onExpire?.());
    return () => countdown.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tappedAt]);

  const ring = useAnimatedProps(() => ({ strokeDashoffset: C * (1 - remaining.value) }));
  if (left === 0) return null;

  return (
    <Animated.View
      testID="undo-bar"
      accessibilityLiveRegion="polite"
      entering={SlideInDown.springify().damping(springs.sheet.damping).stiffness(springs.sheet.stiffness).mass(0.8)}
      exiting={FadeOutDown.duration(220)}
      style={{ backgroundColor: colors.night, borderRadius: radius.tile, borderCurve: 'continuous', boxShadow: shadow.float }}
    >
      <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, minHeight: tap.min + 8 }}>
        <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Svg width={40} height={40} viewBox="0 0 40 40" style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
            <Circle cx="20" cy="20" r={R} stroke="rgba(250,246,238,0.18)" strokeWidth={3} fill="none" />
            <AnimatedCircle cx="20" cy="20" r={R} stroke={colors.kesar} strokeWidth={3} fill="none" strokeLinecap="round" strokeDasharray={`${C} ${C}`} animatedProps={ring} />
          </Svg>
          <AppText variant="number" color={colors.kesar} style={{ fontSize: 16, lineHeight: 20 }}>
            {String(left)}
          </AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText bold color={colors.onBrand} numberOfLines={2}>
            {text}
          </AppText>
        </View>
        <PressableScale
          testID="undo-button"
          accessibilityRole="button"
          accessibilityLabel={t('undo.action')}
          haptic="warn"
          onPress={onUndo}
          faceStyle={{ minHeight: 48, minWidth: 88, paddingHorizontal: 18, borderRadius: radius.button, borderCurve: 'continuous', backgroundColor: colors.ghee, alignItems: 'center', justifyContent: 'center' }}
        >
          <AppText bold color={colors.siyahi}>
            {t('undo.action')}
          </AppText>
        </PressableScale>
      </View>
    </Animated.View>
  );
}
