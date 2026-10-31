// After every tap: what was marked, a 5-second countdown, and Undo. The bar shrinks as time runs out.
import { UNDO_MS, createUndoCountdown, undoSecondsLeft } from '@pohnch/core';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useLang } from '../lang';
import { colors, radius, tap } from '../theme';
import { AppText } from './AppText';

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

  const bar = useAnimatedStyle(() => ({ width: `${remaining.value * 100}%` }));
  if (left === 0) return null;

  return (
    <View testID="undo-bar" accessibilityLiveRegion="polite" style={{ backgroundColor: colors.siyahi, borderRadius: radius.card, overflow: 'hidden' }}>
      <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: tap.min }}>
        <View style={{ flex: 1 }}>
          <AppText bold color={colors.ghee} numberOfLines={2}>
            {text}
          </AppText>
        </View>
        <AppText variant="number" color={colors.kesar} style={{ fontSize: 22, lineHeight: 28 }}>
          {String(left)}
        </AppText>
        <Pressable
          testID="undo-button"
          accessibilityRole="button"
          accessibilityLabel={t('undo.action')}
          onPress={onUndo}
          style={{ minHeight: 48, minWidth: 88, paddingHorizontal: 16, borderRadius: radius.button, backgroundColor: colors.ghee, alignItems: 'center', justifyContent: 'center' }}
        >
          <AppText bold color={colors.siyahi}>
            {t('undo.action')}
          </AppText>
        </Pressable>
      </View>
      <Animated.View style={[{ height: 4, backgroundColor: colors.kesar }, dir === 'rtl' ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }, bar]} />
    </View>
  );
}
