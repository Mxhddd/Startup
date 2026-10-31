// The driver's tap. The next expected tap is the one big button (104 px); every other tap is 64 px.
// Van-wide taps use hold={true}: the fill grows for 0.8 s and only a full hold confirms.
import { HOLD_MS, createHold } from '@pohnch/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useLang } from '../lang';
import { colors, radius, stepColors, tap, type Step } from '../theme';
import { AppText } from './AppText';
import { Icon } from './icons';

type Tone = Step | 'neutral' | 'help';

const tones: Record<'neutral' | 'help', { fill: string; text: string }> = {
  neutral: { fill: colors.white, text: colors.siyahi },
  help: { fill: colors.shingarf, text: colors.white },
};

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
  icon?: Step;
  hold?: boolean;
  disabled?: boolean;
  onConfirm: () => void;
  testID?: string;
}) {
  const { t, dir } = useLang();
  const c = tone === 'neutral' || tone === 'help' ? tones[tone] : stepColors[tone];
  const height = size === 'next' ? tap.next : tap.min;
  const progress = useSharedValue(0);
  const [holding, setHolding] = useState(false);
  // Keep the latest onConfirm without rebuilding the hold timer.
  const confirmRef = useRef(onConfirm);
  confirmRef.current = onConfirm;
  const holdCtl = useMemo(
    () =>
      createHold(() => {
        setHolding(false);
        progress.value = 0;
        confirmRef.current();
      }),
    [progress],
  );

  useEffect(() => () => {
    holdCtl.release();
  }, [holdCtl]);

  const start = () => {
    if (!hold || disabled) return;
    setHolding(true);
    progress.value = withTiming(1, { duration: HOLD_MS, easing: Easing.linear });
    holdCtl.press();
  };

  const cancel = () => {
    if (!holdCtl.release()) return;
    setHolding(false);
    progress.value = withTiming(0, { duration: 150 });
  };

  // The hold fill grows from the reading start: right in Urdu, left in English.
  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  const neutral = tone === 'neutral';
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hold ? t('tap.hold') : undefined}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={hold ? undefined : onConfirm}
      onPressIn={start}
      onPressOut={cancel}
      style={({ pressed }) => ({
        minHeight: height,
        borderRadius: radius.button,
        backgroundColor: disabled ? colors.absentBg : c.fill,
        borderWidth: neutral ? 2 : 0,
        borderColor: colors.siyahi,
        overflow: 'hidden',
        opacity: pressed && !hold ? 0.85 : 1,
        justifyContent: 'center',
      })}
    >
      {hold ? (
        <Animated.View
          pointerEvents="none"
          style={[
            { position: 'absolute', top: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.28)' },
            dir === 'rtl' ? { right: 0 } : { left: 0 },
            fillStyle,
          ]}
        />
      ) : null}
      <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20 }}>
        {icon ? <Icon name={icon} size={size === 'next' ? 34 : 26} color={disabled ? colors.absentText : c.text} /> : null}
        <View style={{ flex: 1 }}>
          <AppText variant={size === 'next' ? 'title' : 'body'} bold color={disabled ? colors.absentText : c.text}>
            {holding ? t('tap.holding') : label}
          </AppText>
          {sublabel ? (
            <AppText variant="small" color={disabled ? colors.absentText : c.text}>
              {hold && !holding ? `${sublabel} · ${t('tap.hold')}` : sublabel}
            </AppText>
          ) : hold && !holding ? (
            <AppText variant="small" color={c.text}>
              {t('tap.hold')}
            </AppText>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
