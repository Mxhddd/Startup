// Text that rolls to its new value like the iOS clock: the old value lifts away and fades while the
// new one rises in from below. Used for minutes and counts that change while you watch.
import type { ComponentProps } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { springs } from '../motion';
import { AppText } from './AppText';

export function RollingText({ text, ...textProps }: { text: string } & Omit<ComponentProps<typeof AppText>, 'children'>) {
  return (
    <View style={{ overflow: 'hidden' }}>
      <Animated.View key={text} entering={FadeInDown.springify().damping(springs.number.damping).stiffness(springs.number.stiffness)} exiting={FadeOutUp.duration(160)}>
        <AppText {...textProps}>{text}</AppText>
      </Animated.View>
    </View>
  );
}
