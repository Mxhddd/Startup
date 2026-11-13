// How screens move when you go forward and back: the iOS push (a quick slide with the old screen easing
// out under it), and it comes from the side you read from: from the left in Urdu, the right in English.
import { Platform } from 'react-native';
import { useLang } from '../lang';
import { colors } from '../theme';
import { durations } from '../motion';

export function useScreenOptions() {
  const { dir } = useLang();
  const animation = dir === 'rtl' ? (Platform.OS === 'ios' ? 'slide_from_left' : 'ios_from_left') : 'ios_from_right';
  return {
    headerShown: false,
    contentStyle: { backgroundColor: colors.ghee },
    animation,
    animationDuration: durations.screen,
    gestureEnabled: true,
    fullScreenGestureEnabled: true,
  } as const;
}
