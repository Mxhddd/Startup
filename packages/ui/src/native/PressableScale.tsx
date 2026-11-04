// Every pressable thing in the apps goes through here, so they all feel the same:
// - it sinks on a firm spring when the finger lands and comes back with a small, lively overshoot;
// - a big button with a "lip" (the darker edge under it, from the v5 designs) is pushed down into it,
//   like a real key;
// - a light haptic lands with the finger.
// The press is driven on the UI thread (Reanimated), so it stays smooth even while the JS thread is busy.
import { useRef, type ReactNode } from 'react';
import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { pressScale, springs } from '../motion';
import { feel as feelIt } from './feedback';
import type { FeelKind } from '../feedbackTable';
import { haptic, type HapticKind } from './haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);


const PRESS_FEEL: Record<Exclude<HapticKind, 'none'>, FeelKind> = { tap: 'tap', press: 'press', tick: 'tick', success: 'confirm', warn: 'undo' };
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
  /** v11: lean toward the finger (a few degrees of 3D tilt from where it lands). For cards and rows. */
  tilt?: boolean;
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
  tilt = false,
  ...rest
}: PressableScaleProps) {
  const down = useSharedValue(0); // 0 up, 1 pressed
  const rx = useSharedValue(0);
  const ry = useSharedValue(0);
  const size = useRef({ w: 1, h: 1 });
  const reduce = useReducedMotion();
  const depth = lip?.depth ?? 5;
  const target = pressScale[scaleTo];

  const face = useAnimatedStyle(() => ({
    transform: [
      { perspective: 700 },
      { translateY: lip ? down.value * depth * 0.8 : 0 },
      { rotateX: `${rx.value}deg` },
      { rotateY: `${ry.value}deg` },
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
      onLayout={(e) => {
        size.current = { w: e.nativeEvent.layout.width || 1, h: e.nativeEvent.layout.height || 1 };
        rest.onLayout?.(e);
      }}
      onPressIn={(e) => {
        down.value = withSpring(1, springs.press);
        if (tilt && !reduce) {
          // Lean toward the finger: up to 7 degrees each way, from where it lands on the card.
          const fx = Math.max(0, Math.min(1, e.nativeEvent.locationX / size.current.w)) - 0.5;
          const fy = Math.max(0, Math.min(1, e.nativeEvent.locationY / size.current.h)) - 0.5;
          rx.value = withSpring(-fy * 10, springs.press);
          ry.value = withSpring(fx * 14, springs.press);
        }
        // v9: the touch and its sound together (the press kinds map onto the feedback table).
        if (feel !== 'none' && !disabled) feelIt(PRESS_FEEL[feel]);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        down.value = withSpring(0, springs.release);
        rx.value = withSpring(0, springs.release);
        ry.value = withSpring(0, springs.release);
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
