// The picture half of a moment (v9, canvas "Z9P-Day"), drawn with Skia around the step's disc and
// timed to its sound (feedback.ts):
//   - ring:  a coloured ring closes around the disc (in the van, home);
//   - burst: kesar stars, our 8-point star, rise and settle into a small constellation, then a
//            thin line joins them (reached school);
//   - glow:  a warm glow swells out from the centre and fades (home).
// Reduce Motion: everything appears at its end state at once, without travel.
import { BlurMask, Canvas, Circle, Group, Path, Skia, vec, type SkPath } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { Easing, useDerivedValue, useReducedMotion, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';
import { colors } from '../theme';

const STAR = Skia.Path.MakeFromSVGString('M0 -10 L2.4 -2.4 L10 0 L2.4 2.4 L0 10 L-2.4 2.4 L-10 0 L-2.4 -2.4 Z')!;
// Where the stars settle (relative to the centre): a little constellation above the disc.
const SPOTS = [[-46, -34], [-22, -58], [6, -44], [30, -62], [52, -30], [-38, 14], [44, 16]] as const;

function constellation(): SkPath {
  const p = Skia.PathBuilder.Make();
  SPOTS.slice(0, 5).forEach(([x, y], i) => (i === 0 ? p.moveTo(x, y) : p.lineTo(x, y)));
  return p.detach();
}
const LINE = constellation();

function FlyingStar({ i, t, c }: { i: number; t: SharedValue<number>; c: number }) {
  const [tx, ty] = SPOTS[i] as readonly [number, number];
  const transform = useDerivedValue(() => {
    // Each star starts a little later, flies out on an ease-out curve and turns as it goes.
    const p = Math.min(1, Math.max(0, (t.value - i * 0.06) / 0.7));
    const e = 1 - (1 - p) ** 3;
    return [{ translateX: c + tx * e }, { translateY: c + ty * e - Math.sin(e * Math.PI) * 10 }, { rotate: e * Math.PI }, { scale: 0.3 + 0.7 * e }];
  });
  const opacity = useDerivedValue(() => Math.min(1, Math.max(0, (t.value - i * 0.06) * 5)));
  return (
    <Group transform={transform} opacity={opacity}>
      <Path path={STAR} color={colors.kesar} />
    </Group>
  );
}

export function MomentFX({ kind, color, size = 160 }: { kind: 'ring' | 'burst' | 'glow' | 'none'; color: string; size?: number }) {
  const reduce = useReducedMotion();
  const t = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    if (reduce) return;
    t.value = withDelay(120, withTiming(1, { duration: kind === 'burst' ? 1400 : 900, easing: Easing.out(Easing.cubic) }));
  }, [kind, reduce, t]);

  const c = size / 2;
  const ring = useDerivedValue(() => {
    const p = Skia.PathBuilder.Make();
    p.addArc({ x: c - 34, y: c - 34, width: 68, height: 68 }, -90, Math.max(0.01, 360 * Math.min(1, t.value) - 0.01));
    return p.detach();
  });
  const lineEnd = useDerivedValue(() => Math.max(0, Math.min(1, (t.value - 0.6) / 0.4)));
  const glowR = useDerivedValue(() => 20 + t.value * c * 0.9);
  const glowO = useDerivedValue(() => 0.55 * (1 - t.value));
  if (kind === 'none') return null;
  return (
    <Canvas style={{ position: 'absolute', width: size, height: size, left: -size / 2, top: -size / 2 }} pointerEvents="none">
      {kind === 'ring' ? <Path path={ring} color={color} style="stroke" strokeWidth={4} strokeCap="round" /> : null}
      {kind === 'glow' ? (
        <Circle c={vec(c, c)} r={glowR} color={colors.kesar} opacity={glowO}>
          <BlurMask blur={14} style="normal" />
        </Circle>
      ) : null}
      {kind === 'burst' ? (
        <>
          <Group transform={[{ translateX: c }, { translateY: c }]}>
            <Path path={LINE} color={colors.kesar} style="stroke" strokeWidth={1.5} opacity={0.6} end={lineEnd} />
          </Group>
          {SPOTS.map((_, i) => <FlyingStar key={i} i={i} t={t} c={c} />)}
        </>
      ) : null}
    </Canvas>
  );
}
