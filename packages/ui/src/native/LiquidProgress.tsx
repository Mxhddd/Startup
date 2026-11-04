// Liquid progress (v9): the route toward your stop fills like liquid. The fill springs to each new
// value, its leading edge is a gentle moving wave, and a soft sheen slides across it now and then.
// Fills from the reading start (right in Urdu, left in English). Drawn with Skia.
// Reduce Motion: a plain bar that moves to its value, no wave or sheen.
import { Canvas, Group, LinearGradient, Path, RoundedRect, Skia, rrect, rect, vec } from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Easing, useDerivedValue, useReducedMotion, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { useLang } from '../lang';
import { colors } from '../theme';

export function LiquidProgress({ value, color, height = 12, testID }: { value: number; color?: string; height?: number; testID?: string }) {
  const { dir } = useLang();
  const reduce = useReducedMotion();
  const [w, setW] = useState(0);
  const p = useSharedValue(0);
  const phase = useSharedValue(0);
  const sheen = useSharedValue(-0.3);
  const fill = color ?? colors.neel;

  useEffect(() => {
    p.value = withSpring(Math.max(0, Math.min(1, value)), { damping: 22, stiffness: 120, mass: 1 });
  }, [value, p]);
  useEffect(() => {
    if (reduce) return;
    phase.value = withRepeat(withTiming(Math.PI * 2, { duration: 1800, easing: Easing.linear }), -1, false);
    sheen.value = withRepeat(withTiming(1.3, { duration: 2600, easing: Easing.inOut(Easing.quad) }), -1, false);
  }, [reduce, phase, sheen]);

  const r = height / 2;
  const clip = rrect(rect(0, 0, w, height), r, r);
  // The liquid: a rectangle whose leading edge is a small travelling sine wave.
  const liquid = useDerivedValue(() => {
    const path = Skia.PathBuilder.Make();
    const edge = p.value * w;
    const amp = reduce ? 0 : Math.min(3, height * 0.22);
    const fromRight = dir === 'rtl';
    const xAt = (y: number) => {
      const wave = amp * Math.sin(phase.value + (y / height) * Math.PI * 2);
      return fromRight ? w - edge + wave : edge + wave;
    };
    if (fromRight) {
      path.moveTo(w, 0);
      path.lineTo(xAt(0), 0);
      for (let y = 1; y <= height; y++) path.lineTo(xAt(y), y);
      path.lineTo(w, height);
    } else {
      path.moveTo(0, 0);
      path.lineTo(xAt(0), 0);
      for (let y = 1; y <= height; y++) path.lineTo(xAt(y), y);
      path.lineTo(0, height);
    }
    path.close();
    return path.detach();
  });
  const sheenX = useDerivedValue(() => (dir === 'rtl' ? w - sheen.value * w : sheen.value * w));
  const sheenStart = useDerivedValue(() => vec(sheenX.value - 40, 0));
  const sheenEnd = useDerivedValue(() => vec(sheenX.value + 40, 0));

  return (
    <View testID={testID} onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}>
      {w > 0 ? (
        <Canvas style={{ width: w, height }}>
          <RoundedRect x={0} y={0} width={w} height={height} r={r} color={colors.neelTint} />
          <Group clip={clip}>
            <Path path={liquid} color={fill} />
            {!reduce ? (
              <Path path={liquid}>
                <LinearGradient start={sheenStart} end={sheenEnd} colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']} />
              </Path>
            ) : null}
          </Group>
        </Canvas>
      ) : null}
    </View>
  );
}
