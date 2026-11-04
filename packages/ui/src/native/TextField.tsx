// A text box with a floating label (v8 "forms done properly"). Empty and resting, the label sits inside
// the box like a placeholder; on focus (or once filled) it glides up and shrinks to a caption, so the
// box always says what it is for. The border turns neel on focus with a soft ring. With an error the
// border turns red, the box gives a small shake and the message shows underneath.
// Latin-only fields (plates, numbers) can be forced left to right.
import { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useLang, uiFont } from '../lang';
import { colors, fonts, radius, shadow, space, type as typeScale } from '../theme';
import { AppText } from './AppText';
import { feel } from './feedback';

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  ltr = false,
  maxLength = 80,
  testID,
  onBlur,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ltr?: boolean;
  maxLength?: number;
  testID?: string;
  onBlur?: () => void;
  /** A message under the box; the box shakes once each time it appears. */
  error?: string | null;
}) {
  const { lang, dir } = useLang();
  const d = ltr ? 'ltr' : dir;
  const [focused, setFocused] = useState(false);
  const up = useSharedValue(value ? 1 : 0);
  const shake = useSharedValue(0);
  const floating = focused || value.length > 0;

  useEffect(() => {
    up.value = withSpring(floating ? 1 : 0, { damping: 20, stiffness: 260 });
  }, [floating, up]);
  useEffect(() => {
    if (error) feel('error');
    if (error) shake.value = withSequence(withTiming(-8, { duration: 50 }), withTiming(8, { duration: 70 }), withTiming(-5, { duration: 60 }), withTiming(0, { duration: 60 }));
  }, [error, shake]);

  // The label moves from the middle of the 64 px box to its top edge, and from body size to caption.
  const labelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(up.value, [0, 1], [0, -15]) }, { scale: interpolate(up.value, [0, 1], [1, typeScale.caption / typeScale.body]) }],
  }));
  const box = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const edge = error ? colors.dangerText : focused ? colors.link : colors.line;

  return (
    <View style={{ gap: 6 }}>
      <Animated.View
        style={[
          {
            minHeight: 64,
            borderRadius: radius.card,
            borderCurve: 'continuous',
            borderWidth: 2,
            borderColor: edge,
            boxShadow: focused ? `0px 0px 0px 4px ${error ? colors.dangerBg : colors.neelTint}` : shadow.card,
            backgroundColor: colors.white,
            paddingHorizontal: space.lg,
            justifyContent: 'center',
          },
          box,
        ]}
      >
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: space.lg, right: space.lg, top: 0, bottom: 0, justifyContent: 'center', transformOrigin: d === 'rtl' ? 'right' : 'left' }, labelStyle]}>
          <AppText bold={floating} color={error ? colors.dangerText : floating && focused ? colors.link : colors.ink2} numberOfLines={1} style={{ fontSize: typeScale.body, lineHeight: 24 }}>
            {label}
          </AppText>
        </Animated.View>
        <TextInput
          testID={testID}
          accessibilityLabel={label}
          accessibilityHint={error ?? undefined}
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          selectionColor={colors.link}
          placeholder={focused && !value ? placeholder : undefined}
          placeholderTextColor={colors.ink2}
          maxLength={maxLength}
          maxFontSizeMultiplier={1.3}
          style={{
            minHeight: 60,
            paddingTop: 22,
            paddingBottom: 4,
            fontSize: 18,
            color: colors.siyahi,
            fontFamily: ltr ? fonts.latin.bold : uiFont(lang, 'regular'),
            textAlign: d === 'rtl' ? 'right' : 'left',
            writingDirection: d,
          }}
        />
      </Animated.View>
      {error ? (
        <AppText variant="small" bold color={colors.dangerText}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
