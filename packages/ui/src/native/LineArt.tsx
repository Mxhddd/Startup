// Empty states drawn in the logo's language: route dots that travel into the star ("the path
// arrives"). The line draws itself in, then the star settles. Calm, never a stock illustration.
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { springs } from '../motion';
import { colors } from '../theme';
import { StarIcon } from './icons';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const ROUTE = 'M14 96 C40 96 44 60 76 60 C108 60 112 30 150 30';
const LEN = 190;

export function LineArt({ width = 200, color }: { width?: number; color?: string }) {
  const ink = color ?? colors.link;
  const draw = useSharedValue(0);
  const star = useSharedValue(0);
  useEffect(() => {
    draw.value = withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.cubic) });
    star.value = withDelay(900, withSpring(1, springs.pop));
  }, [draw, star]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: LEN * (1 - draw.value) }));
  const starStyle = useAnimatedStyle(() => ({ opacity: star.value, transform: [{ scale: 0.4 + 0.6 * star.value }, { rotate: `${(1 - star.value) * -90}deg` }] }));
  const h = (width * 120) / 200;
  return (
    <View style={{ width, height: h }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={h} viewBox="0 0 200 120">
        <AnimatedPath d={ROUTE} stroke={ink} strokeWidth={5} strokeLinecap="round" strokeDasharray={`2 12`} fill="none" opacity={0.35} />
        <AnimatedPath d={ROUTE} stroke={ink} strokeWidth={5} strokeLinecap="round" fill="none" strokeDasharray={`${LEN} ${LEN}`} animatedProps={props} />
      </Svg>
      <Animated.View style={[{ position: 'absolute', left: (150 / 200) * width - 22, top: (30 / 120) * h - 22 }, starStyle]}>
        <StarIcon size={44} color={colors.kesar} />
      </Animated.View>
    </View>
  );
}
