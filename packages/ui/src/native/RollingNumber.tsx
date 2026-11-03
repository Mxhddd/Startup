// A number that rolls like an odometer: each digit is its own little wheel and spins to the new
// value on a spring, the changed digits only. Used for the big "minutes to your door".
import { useEffect } from 'react';
import { View, type TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { springs } from '../motion';
import { colors } from '../theme';
import { AppText } from './AppText';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

function Wheel({ digit, size, color, delay }: { digit: number; size: number; color: string; delay: number }) {
  const lineHeight = Math.round(size * 1.12);
  const y = useSharedValue(-digit * lineHeight);
  useEffect(() => {
    y.value = withDelay(delay, withSpring(-digit * lineHeight, springs.number));
  }, [digit, lineHeight, delay, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <View style={{ height: lineHeight, overflow: 'hidden' }}>
      <Animated.View style={style}>
        {DIGITS.map((d) => (
          <AppText key={d} variant="number" color={color} style={{ fontSize: size, lineHeight, letterSpacing: -size * 0.03 }}>
            {d}
          </AppText>
        ))}
      </Animated.View>
    </View>
  );
}

export function RollingNumber({ value, size = 64, color = colors.siyahi, style }: { value: number; size?: number; color?: string; style?: TextStyle }) {
  const digits = String(Math.max(0, Math.round(value))).split('').map(Number);
  return (
    <View accessibilityRole="text" accessibilityLabel={String(value)} style={[{ flexDirection: 'row', direction: 'ltr' }, style]}>
      {digits.map((d, i) => (
        // Keyed from the right, so "9" -> "10" keeps the ones wheel and adds a tens wheel.
        <Wheel key={digits.length - i} digit={d} size={size} color={color} delay={(digits.length - 1 - i) * 40} />
      ))}
    </View>
  );
}


