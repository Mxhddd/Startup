// The parent's bottom sheet over the map (v5): white, rounded, lifted by a soft shadow.
// Drag the grab bar between two heights, peek and open. Let go and it coasts to the snap it was heading
// for on the sheet spring, carrying the speed of your flick, like an iOS sheet. Past either end it
// stretches a little (rubber band) instead of stopping dead.
import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';
import { Gradient } from './Gradient';
import { useLang } from '../lang';
import { pickSnap, rubberBand, springs } from '../motion';
import { colorScheme, colors, radius, shadow, space } from '../theme';
import { feel } from './feedback';

export function MapSheet({
  children,
  peek = 220,
  open = 520,
  bottomInset = 0,
  expanded,
  onExpandedChange,
  progress,
  accent,
}: {
  /** v12 trip-state theming: the colour of the moment (neel on the way, zamurrad in the van or home,
   * kesar at school, shingarf when late) washes softly down from the sheet's top edge and lights the dot. */
  accent?: string | null;
  children: ReactNode;
  peek?: number;
  open?: number;
  bottomInset?: number;
  /** Open or close it from outside (for example the "Trip" button). */
  expanded?: boolean;
  onExpandedChange?: (open: boolean) => void;
  /** Written every frame: 0 at peek, 1 fully open. The screen uses it to dim and sink the map. */
  progress?: SharedValue<number>;
}) {
  const { t } = useLang();
  const hidden = open - peek; // how far down the sheet sits when peeking
  const y = useSharedValue(hidden);
  const startY = useSharedValue(hidden);

  useEffect(() => {
    if (expanded === undefined) return;
    y.value = withSpring(expanded ? 0 : hidden, springs.sheet);
  }, [expanded, hidden, y]);

  const settled = (isOpen: boolean) => {
    feel(isOpen ? 'sheetUp' : 'sheetDown');
    onExpandedChange?.(isOpen);
  };

  const pan = Gesture.Pan()
    .onBegin(() => {
      startY.value = y.value;
    })
    .onUpdate((e) => {
      const raw = startY.value + e.translationY;
      // Inside the range it follows the finger; past it, it stretches.
      y.value = raw < 0 ? rubberBand(raw, open) : raw > hidden ? hidden + rubberBand(raw - hidden, open) : raw;
    })
    .onEnd((e) => {
      const to = pickSnap(y.value, e.velocityY, [0, hidden]);
      const wasOpen = startY.value < hidden / 2;
      y.value = withSpring(to, { ...springs.sheet, velocity: e.velocityY });
      if ((to === 0) !== wasOpen) runOnJS(settled)(to === 0);
    });

  const tapHandle = Gesture.Tap().onEnd(() => {
    const goOpen = y.value > hidden / 2;
    y.value = withSpring(goOpen ? 0 : hidden, springs.sheet);
    runOnJS(settled)(goOpen);
  });

  useAnimatedReaction(
    () => (hidden > 0 ? 1 - y.value / hidden : 0),
    (p) => {
      if (progress) progress.value = Math.max(0, Math.min(1.1, p));
    },
  );

  // The sheet rises from below on the heavy sheet spring when the screen first opens.
  const enter = useSharedValue(0);
  useEffect(() => {
    enter.value = withSpring(1, springs.sheet);
  }, [enter]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value + (1 - enter.value) * (open - hidden + 80) }] }));

  return (
    <Animated.View
      testID="map-sheet"
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: -open, // room underneath for the stretch
          height: open * 2 + bottomInset,
          backgroundColor: 'transparent',
          borderTopLeftRadius: radius.sheet,
          borderTopRightRadius: radius.sheet,
          paddingHorizontal: space.xl,
          paddingBottom: open + bottomInset,
          boxShadow: shadow.sheet,
        },
        style,
      ]}
    >
      {/* v11: frosted glass, so the map stays alive behind the sheet (a strong tint keeps text crisp). */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, overflow: 'hidden' }}>
        <BlurView intensity={50} tint={colorScheme() === 'dark' ? 'dark' : 'light'} style={{ flex: 1, backgroundColor: colorScheme() === 'dark' ? 'rgba(24,32,68,0.84)' : 'rgba(255,255,255,0.80)' }} />
        {accent ? (
          <Animated.View key={accent} entering={FadeIn.duration(600)} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 140 }}>
            <Gradient stops={[[0, accent, 0.16], [1, accent, 0]]} />
          </Animated.View>
        ) : null}
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.9)' }} />
      </View>
      {/* v10: the sheet's top edge rises into a small pointed arch around the handle, a kesar dot at its point. */}
      <View pointerEvents="none" style={{ position: 'absolute', top: -20, left: 0, right: 0, height: 24, alignItems: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Svg width={128} height={24} viewBox="0 0 128 24">
          <Path d="M0 24 L0 22 C14 22 34 21 44 14 C52 9 59 3 64 0 C69 3 76 9 84 14 C94 21 114 22 128 22 L128 24 Z" fill={colorScheme() === 'dark' ? 'rgba(24,32,68,0.9)' : 'rgba(255,255,255,0.86)'} />
        </Svg>
        <View style={{ position: 'absolute', top: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: accent ?? colors.kesar }} />
      </View>
      <GestureDetector gesture={Gesture.Exclusive(pan, tapHandle)}>
        <View accessibilityRole="adjustable" accessibilityLabel={t('sheet.handle')} style={{ height: 30, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 40, height: 5, borderRadius: 3, borderCurve: 'continuous', backgroundColor: colors.line }} />
        </View>
      </GestureDetector>
      <View style={{ flex: 1, gap: space.lg }}>{children}</View>
    </Animated.View>
  );
}
