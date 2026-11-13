// The hand-off from the native splash (neel with the star) into the app: the same star sits in the
// middle, gives one small breath, then the neel lifts away like a curtain and the app is underneath.
// It plays once per launch and never blocks touches once it starts leaving.
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { springs } from '../motion';
import { colors } from '../theme';
import { StarIcon } from './icons';

export function LaunchReveal() {
  const [done, setDone] = useState(false);
  const star = useSharedValue(1);
  const lift = useSharedValue(0);
  useEffect(() => {
    star.value = withSequence(withTiming(1.12, { duration: 260, easing: Easing.out(Easing.quad) }), withSpring(0.001, springs.press));
    lift.value = withDelay(120, withTiming(1, { duration: 380, easing: Easing.inOut(Easing.cubic) }, (f) => {
      if (f) runOnJS(setDone)(true);
    }));
  }, [star, lift]);
  const curtain = useAnimatedStyle(() => ({ opacity: 1 - lift.value, transform: [{ translateY: -lift.value * 60 }, { scale: 1 + lift.value * 0.06 }] }));
  const starStyle = useAnimatedStyle(() => ({ transform: [{ scale: star.value }] }));
  if (done) return null;
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.neel, alignItems: 'center', justifyContent: 'center' }, curtain]}>
      <Animated.View style={starStyle}>
        <StarIcon size={96} color={colors.kesar} />
      </Animated.View>
    </Animated.View>
  );
}
