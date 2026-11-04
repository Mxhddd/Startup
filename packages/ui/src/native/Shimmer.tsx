// Loading placeholders that breathe: soft sand bars with a band of light gliding across them,
// shaped like what is coming, so the screen never looks empty or frozen.
// v12: `arches` draws arch-topped placeholders (for niches and portraits) with the same light band.
import { useEffect } from 'react';
import { View, type DimensionValue } from 'react-native';
import Animated, { Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { archPath, colors } from '../theme';

const ARect = Animated.createAnimatedComponent(Rect);
let sid = 0;

function ArchPlaceholder({ w, h, x }: { w: number; h: number; x: { value: number } }) {
  const id = `sh${++sid}`;
  const props = useAnimatedProps(() => ({ x: -60 + x.value * (w + 120) }));
  return (
    <Svg width={w} height={h}>
      <Defs>
        <ClipPath id={`${id}c`}><Path d={archPath(w, h)} /></ClipPath>
        <LinearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={colors.white} stopOpacity={0} />
          <Stop offset="0.5" stopColor={colors.white} stopOpacity={0.6} />
          <Stop offset="1" stopColor={colors.white} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <G clipPath={`url(#${id}c)`}>
        <Rect x={0} y={0} width={w} height={h} fill={colors.sand} />
        <ARect animatedProps={props} y={0} width={60} height={h} fill={`url(#${id}g)`} />
      </G>
    </Svg>
  );
}

export function Shimmer({ lines = [], arches }: { lines?: { w: DimensionValue; h: number }[]; arches?: { count: number; w: number; h: number } }) {
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }), -1, false);
  }, [x]);
  const band = useAnimatedStyle(() => ({ transform: [{ translateX: -120 + x.value * 520 }], opacity: 0.55 }));
  return (
    <View style={{ gap: 12 }} accessibilityRole="progressbar">
      {arches ? (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {Array.from({ length: arches.count }, (_, i) => <ArchPlaceholder key={i} w={arches.w} h={arches.h} x={x} />)}
        </View>
      ) : null}
      {lines.map((l, i) => (
        <View key={i} style={{ width: l.w, height: l.h, borderRadius: Math.min(12, l.h / 2), borderCurve: 'continuous', backgroundColor: colors.sand, overflow: 'hidden' }}>
          <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, width: 120, backgroundColor: colors.white }, band]} />
        </View>
      ))}
    </View>
  );
}
