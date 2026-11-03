// Every pressable thing in the apps goes through here, so they all feel the same:
// - it sinks on a firm spring when the finger lands and comes back with a small, lively overshoot;
// - a big button with a "lip" (the darker edge under it, from the v5 designs) is pushed down into it,
//   like a real key;
// - a light haptic lands with the finger.
// The press is driven on the UI thread (Reanimated), so it stays smooth even while the JS thread is busy.
import type { ReactNode } from 'react';
import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { pressScale, springs } from '../motion';
import { haptic, type HapticKind } from './haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  /** How far it sinks: 'big' for the large driver buttons, 'small' for most, 'chip' for pills. */
  scaleTo?: keyof typeof pressScale;
  haptic?: HapticKind;
  /** The solid edge under the button (colour and depth in px). The press pushes the face into it. */
  lip?: { color: string; depth?: number };
  /** A soft coloured bloom under the button (a shadow colour from the theme); it tightens on press. */
  glow?: string;
  /** Layout of the whole thing (flex, margins, alignSelf). */
  style?: StyleProp<ViewStyle>;
  /** The visible face (background, radius, padding). */
  faceStyle?: StyleProp<ViewStyle>;
};

export function PressableScale({
  children,
  scaleTo = 'small',
  haptic: feel = 'tap',
  lip,
  glow,
  style,
  faceStyle,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: PressableScaleProps) {
  const down = useSharedValue(0); // 0 up, 1 pressed
  const depth = lip?.depth ?? 5;
  const target = pressScale[scaleTo];

  const face = useAnimatedStyle(() => ({
    transform: [
      { translateY: lip ? down.value * depth * 0.8 : 0 },
      { scale: 1 - (1 - target) * down.value },
    ],
  }));

  const bloom = useAnimatedStyle(() => ({ opacity: 1 - down.value * 0.55, transform: [{ scaleX: 1 - down.value * 0.04 }] }));

  const radiusOf = (s: StyleProp<ViewStyle>) => {
    const flat = (Array.isArray(s) ? Object.assign({}, ...s.filter(Boolean)) : s) as ViewStyle | undefined;
    return flat?.borderRadius;
  };

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        down.value = withSpring(1, springs.press);
        if (feel !== 'none' && !disabled) haptic[feel]();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        down.value = withSpring(0, springs.release);
        onPressOut?.(e);
      }}
      style={[{ paddingBottom: lip ? depth : 0 }, style]}
    >
      {glow && !disabled ? (
        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', left: 6, right: 6, top: 10, bottom: 0, borderRadius: radiusOf(faceStyle), borderCurve: 'continuous', boxShadow: `0px 16px 30px ${glow}` }, bloom]}
        />
      ) : null}
      {lip ? (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, right: 0, top: depth, bottom: 0, borderRadius: radiusOf(faceStyle), borderCurve: 'continuous', backgroundColor: disabled ? 'transparent' : lip.color }}
        />
      ) : null}
      <Animated.View style={[faceStyle, face]}>{children}</Animated.View>
    </AnimatedPressable>
  );
}
