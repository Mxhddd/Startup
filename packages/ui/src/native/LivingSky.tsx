// The living sky (v9, canvas "Z9P-Van"): a soft band of light across the top of the map that follows
// the time of day in Karachi: dawn warmth, clear noon, dusk amber, and at night a deep sky with a few
// stars that twinkle. It sits over the map under the floating chips, never takes a touch, and changes
// mood by cross-fading. Drawn with Skia on the GPU. Reduce Motion: the stars hold still.
import { karachiHour } from '@pohnch/core';
import { Canvas, Circle, Group, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { Easing, useDerivedValue, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { colorScheme, mapMoodAt, type MapMood } from '../theme';

/** Top colour of the sky for each mood (it fades to nothing over the map). */
export const SKY: Record<MapMood, [string, string]> = {
  morning: ['rgba(246,201,160,0.62)', 'rgba(246,201,160,0)'],
  day: ['rgba(214,232,250,0.55)', 'rgba(214,232,250,0)'],
  dusk: ['rgba(233,168,106,0.66)', 'rgba(214,140,110,0)'],
  night: ['rgba(10,15,38,0.92)', 'rgba(14,20,48,0)'],
};

const STARS = [
  [0.1, 0.18, 1.6], [0.26, 0.38, 2.2], [0.47, 0.12, 1.4], [0.66, 0.42, 1.8], [0.83, 0.2, 2.2], [0.38, 0.58, 1.2], [0.92, 0.55, 1.4],
] as const;

function Star({ x, y, r, i, clock }: { x: number; y: number; r: number; i: number; clock: { value: number } }) {
  const o = useDerivedValue(() => 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(clock.value * Math.PI * 2 + i * 1.7)));
  return <Circle cx={x} cy={y} r={r} color="#FFFFFF" opacity={o} />;
}

export function LivingSky({ height = 220, mood: fixed }: { height?: number; mood?: MapMood }) {
  const { width } = useWindowDimensions();
  const reduce = useReducedMotion();
  const [mood, setMood] = useState<MapMood>(() => fixed ?? (colorScheme() === 'dark' ? 'night' : mapMoodAt(karachiHour(new Date()))));
  useEffect(() => {
    if (fixed) return setMood(fixed);
    const id = setInterval(() => setMood(colorScheme() === 'dark' ? 'night' : mapMoodAt(karachiHour(new Date()))), 10 * 60_000);
    return () => clearInterval(id);
  }, [fixed]);

  // Cross-fade when the mood changes (a new layer fades in over the old one).
  const [prev, setPrev] = useState<MapMood>(mood);
  const mix = useSharedValue(1);
  useEffect(() => {
    if (mood === prev) return;
    mix.value = 0;
    mix.value = withTiming(1, { duration: 1600 }, () => undefined);
    const id = setTimeout(() => setPrev(mood), 1700);
    return () => clearTimeout(id);
  }, [mood, prev, mix]);

  const clock = useSharedValue(0);
  useEffect(() => {
    if (mood !== 'night' || reduce) return;
    clock.value = withRepeat(withTiming(1, { duration: 4000, easing: Easing.linear }), -1, false);
  }, [mood, reduce, clock]);

  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Canvas style={{ width, height }}>
        <Rect x={0} y={0} width={width} height={height}>
          <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={SKY[prev]} />
        </Rect>
        <Group opacity={mix}>
          <Rect x={0} y={0} width={width} height={height}>
            <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={SKY[mood]} />
          </Rect>
          {mood === 'night' ? STARS.map(([x, y, r], i) => <Star key={i} x={x * width} y={y * height * 0.6} r={r} i={i} clock={clock} />) : null}
        </Group>
      </Canvas>
    </View>
  );
}
