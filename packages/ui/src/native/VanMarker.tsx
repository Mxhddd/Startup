// The van on the map (v9, drawn on the GPU with Skia; canvas "Z9P-Van"). Our van from above: a neel
// body with a white edge, a pale windscreen, the kesar roof stripe, mirrors and the nose arrow.
// It feels like a real thing:
//   - it turns with its heading the short way round, and leans a little into a turn, then straightens;
//   - it settles with a small squash when it stops (as if braking);
//   - its soft, blurred shadow stretches behind it the faster it goes;
//   - at dusk and at night its headlights light the road ahead;
//   - while it waits at your door a calm green glow breathes around it;
//   - two soft ripples spread while it's live.
// Stale signal: grey, still, no ripples, no lights or nose arrow (we never pretend it moves).
// Reduce Motion: no ripples or breathing; turns still follow the heading.
import { headingDelta } from '@pohnch/core';
import { BlurMask, Canvas, Circle, Group, LinearGradient, Path, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { Easing, cancelAnimation, useDerivedValue, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { springs } from '../motion';
import { colors } from '../theme';

const GREY = '#8A8FA3';
const GLASS = '#CFDCE8';
const RIPPLE_MS = 2400;
const BOX = 96; // the drawing is laid out in an 80-unit van box, centred in a 96-unit canvas

/** How far the shadow stretches behind the van: 0 when stopped, up to 1 at about 50 km/h (14 m/s). */
export function shadowStretch(speed: number | null | undefined): number {
  if (!speed || speed <= 0) return 0;
  return Math.min(1, speed / 14);
}

// Headlight beams: two soft cones ahead of the nose (the van faces up, nose at y = 17).
const BEAMS = Skia.Path.MakeFromSVGString('M33 18 L18 -30 L40 -34 Z M47 18 L62 -30 L40 -34 Z')!;
const NOSE = Skia.Path.MakeFromSVGString('M40 4 L46 13 L34 13 Z')!;

export function VanMarker({
  heading = 0,
  stale = false,
  speed = 0,
  size = 80,
  lights = false,
  waiting = false,
}: {
  heading?: number;
  stale?: boolean;
  speed?: number | null;
  size?: number;
  /** Headlights on (dusk and night). */
  lights?: boolean;
  /** Waiting at your door: a breathing green glow. */
  waiting?: boolean;
}) {
  const reduce = useReducedMotion();
  const rot = useSharedValue(heading);
  const lean = useSharedValue(0);
  const squash = useSharedValue(0);
  const appear = useSharedValue(0);
  const stretch = useSharedValue(0);
  const r1 = useSharedValue(0);
  const r2 = useSharedValue(0);
  const breathe = useSharedValue(0);
  const beams = useSharedValue(0);
  const lastSpeed = useRef(speed ?? 0);

  // Turning: the short way round, with a small lean into the turn that springs back.
  useEffect(() => {
    const delta = headingDelta(((rot.value % 360) + 360) % 360, heading);
    rot.value = withSpring(rot.value + delta, springs.layout);
    if (Math.abs(delta) > 4 && !stale) {
      lean.value = withSequence(withTiming(Math.max(-7, Math.min(7, delta * 0.2)), { duration: 260 }), withSpring(0, springs.release));
    }
  }, [heading, rot, lean, stale]);

  // Speed: the shadow stretches; coming to a stop gives one small "braking" squash.
  useEffect(() => {
    const v = stale ? 0 : speed ?? 0;
    stretch.value = withTiming(shadowStretch(v), { duration: 900, easing: Easing.out(Easing.cubic) });
    if (lastSpeed.current > 2 && v < 0.6 && !reduce) {
      squash.value = withSequence(withTiming(1, { duration: 140 }), withSpring(0, springs.pop));
    }
    lastSpeed.current = v;
  }, [speed, stale, stretch, squash, reduce]);

  useEffect(() => {
    appear.value = withSpring(1, springs.pop);
  }, [appear]);

  useEffect(() => {
    beams.value = withTiming(lights && !stale ? 1 : 0, { duration: 900 });
  }, [lights, stale, beams]);

  // Ripples while live; a breathing glow while waiting at the door.
  useEffect(() => {
    if (stale || reduce) {
      cancelAnimation(r1);
      cancelAnimation(r2);
      r1.value = withTiming(1, { duration: 200 });
      r2.value = withTiming(1, { duration: 200 });
      return;
    }
    const ring = () => withRepeat(withTiming(1, { duration: RIPPLE_MS, easing: Easing.out(Easing.quad) }), -1, false);
    r1.value = 0;
    r2.value = 0;
    r1.value = ring();
    r2.value = withDelay(RIPPLE_MS / 2, ring());
  }, [stale, reduce, r1, r2]);
  useEffect(() => {
    if (waiting && !stale && !reduce) breathe.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.quad) }), -1, true);
    else {
      cancelAnimation(breathe);
      breathe.value = withTiming(0, { duration: 300 });
    }
  }, [waiting, stale, reduce, breathe]);

  const c = BOX / 2;
  const scale = size / BOX;
  const body = stale ? GREY : colors.neel;
  const stripe = stale ? colors.ghee : colors.kesar;

  // The van's frame: centre, turn (+ lean), squash, appear; then the 80-unit drawing centred.
  const vanT = useDerivedValue(() => {
    const sq = squash.value;
    return [
      { translateX: c },
      { translateY: c },
      { rotate: ((rot.value + lean.value) * Math.PI) / 180 },
      { scaleX: (1 + sq * 0.06) * appear.value },
      { scaleY: (1 - sq * 0.1) * appear.value },
      { translateX: -40 },
      { translateY: -40 },
    ];
  });
  // The shadow sits under the body and slides back (down in van space) as it speeds up.
  const shadowY = useDerivedValue(() => 21 + stretch.value * 7);
  const shadowH = useDerivedValue(() => 46 * (1 + stretch.value * 0.3));
  const ring1R = useDerivedValue(() => size * 0.3 + r1.value * size * 0.32);
  const ring1O = useDerivedValue(() => 0.28 * (1 - r1.value));
  const ring2R = useDerivedValue(() => size * 0.3 + r2.value * size * 0.32);
  const ring2O = useDerivedValue(() => 0.28 * (1 - r2.value));
  const glowR = useDerivedValue(() => 26 + breathe.value * 10);
  const glowO = useDerivedValue(() => (waiting && !stale ? 0.25 + breathe.value * 0.25 : 0));

  return (
    <View testID="van-marker" style={{ width: size, height: size, opacity: stale ? 0.85 : 1 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Canvas style={{ width: size, height: size }}>
        <Group transform={[{ scale }]}>
          {!stale ? (
            <>
              <Circle cx={c} cy={c} r={ring1R} color={colors.neel} opacity={ring1O} />
              <Circle cx={c} cy={c} r={ring2R} color={colors.neel} opacity={ring2O} />
            </>
          ) : null}
          <Circle cx={c} cy={c} r={glowR} color={colors.zamurrad} opacity={glowO}>
            <BlurMask blur={8} style="normal" />
          </Circle>
          <Group transform={vanT}>
            <Group opacity={beams}>
              <Path path={BEAMS}>
                <LinearGradient start={vec(40, 18)} end={vec(40, -34)} colors={['rgba(255,236,170,0.75)', 'rgba(255,236,170,0)']} />
              </Path>
            </Group>
            <RoundedRect x={25} y={shadowY} width={30} height={shadowH} r={10} color="rgba(20,26,51,0.34)">
              <BlurMask blur={5} style="normal" />
            </RoundedRect>
            <RoundedRect x={27} y={17} width={26} height={46} r={9} color={colors.white} />
            <RoundedRect x={28.5} y={18.5} width={23} height={43} r={7.5} color={body} />
            <RoundedRect x={31} y={22} width={18} height={9} r={3} color={GLASS} />
            <RoundedRect x={37} y={34} width={6} height={22} r={3} color={stripe} />
            <RoundedRect x={23.5} y={25} width={4} height={6} r={2} color={body} />
            <RoundedRect x={52.5} y={25} width={4} height={6} r={2} color={body} />
            {!stale ? (
              <>
                <Path path={NOSE} color={colors.white} style="stroke" strokeWidth={2} strokeJoin="round" />
                <Path path={NOSE} color={colors.neel} />
              </>
            ) : null}
          </Group>
        </Group>
      </Canvas>
    </View>
  );
}
