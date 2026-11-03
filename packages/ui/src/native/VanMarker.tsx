// The van on the map (v8, canvas "Z8P-Home"): our own van drawn from above: a neel body with a white
// edge, a pale windscreen, a kesar roof stripe and a small arrow at the nose. The whole van turns with
// its heading (the short way round, on a spring), two soft ripples spread from it while it's live, and
// its shadow stretches a little behind it the faster it goes.
// Grey, still, without ripples or the nose arrow when the signal is stale: we never pretend it moves.
import { headingDelta } from '@pohnch/core';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Ellipse, Path, Rect } from 'react-native-svg';
import { durations, springs } from '../motion';
import { colors } from '../theme';

const GREY = '#8A8FA3';
const RIPPLE_MS = 2400;
/** The van's own colours for the drawing (they match the canvas). */
const GLASS = '#CFDCE8';

/** One ring that grows out of the van and fades, like a ripple on water. */
function Ripple({ v, size }: { v: SharedValue<number>; size: number }) {
  const style = useAnimatedStyle(() => ({ opacity: 0.28 * (1 - v.value), transform: [{ scale: 0.5 + v.value * 0.9 }] }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderCurve: 'continuous', backgroundColor: colors.neel }, style]} />;
}

/** How far the shadow stretches behind the van: 0 when stopped, up to 1 at about 50 km/h (14 m/s). */
export function shadowStretch(speed: number | null | undefined): number {
  if (!speed || speed <= 0) return 0;
  return Math.min(1, speed / 14);
}

export function VanMarker({ heading = 0, stale = false, speed = 0, size = 80 }: { heading?: number; stale?: boolean; speed?: number | null; size?: number }) {
  const rot = useSharedValue(heading);
  const r1 = useSharedValue(0);
  const r2 = useSharedValue(0);
  const appear = useSharedValue(0);
  const stretch = useSharedValue(0);

  useEffect(() => {
    // Turn the short way round, e.g. 350° to 10° is +20°, not -340°.
    rot.value = withSpring(rot.value + headingDelta(rot.value % 360, heading), springs.layout);
  }, [heading, rot]);

  useEffect(() => {
    stretch.value = withTiming(stale ? 0 : shadowStretch(speed), { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [speed, stale, stretch]);

  useEffect(() => {
    appear.value = withSpring(1, springs.pop);
  }, [appear]);

  useEffect(() => {
    if (stale) {
      cancelAnimation(r1);
      cancelAnimation(r2);
      r1.value = withTiming(1, { duration: durations.fade });
      r2.value = withTiming(1, { duration: durations.fade });
    } else {
      const ring = () => withRepeat(withTiming(1, { duration: RIPPLE_MS, easing: Easing.out(Easing.quad) }), -1, false);
      r1.value = 0;
      r2.value = 0;
      r1.value = ring();
      r2.value = withDelay(RIPPLE_MS / 2, ring());
    }
  }, [stale, r1, r2]);

  const turn = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }, { scale: appear.value }] }));
  // The shadow sits under the van and slides back (down, before turning) as it speeds up.
  const shade = useAnimatedStyle(() => ({ transform: [{ translateY: 3 + stretch.value * 7 }, { scaleY: 1 + stretch.value * 0.35 }], opacity: 0.22 + stretch.value * 0.06 }));
  const body = stale ? GREY : colors.neel;
  const stripe = stale ? colors.ghee : colors.kesar;
  const ring = size * 0.62;

  return (
    <View testID="van-marker" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', opacity: stale ? 0.85 : 1 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {!stale ? (
        <>
          <Ripple v={r1} size={ring} />
          <Ripple v={r2} size={ring} />
        </>
      ) : null}
      <Animated.View style={[{ position: 'absolute', width: size, height: size }, turn]}>
        <Animated.View style={[{ position: 'absolute', width: size, height: size }, shade]}>
          <Svg width={size} height={size} viewBox="0 0 80 80">
            <Ellipse cx="40" cy="42" rx="14" ry="23" fill={colors.night} />
          </Svg>
        </Animated.View>
        <Svg width={size} height={size} viewBox="0 0 80 80" style={{ position: 'absolute' }}>
          {/* body, windscreen at the front, roof stripe */}
          <Rect x="27" y="17" width="26" height="46" rx="9" fill={body} stroke={colors.white} strokeWidth={3} />
          <Rect x="31" y="22" width="18" height="9" rx="3" fill={GLASS} />
          <Rect x="37" y="34" width="6" height="22" rx="3" fill={stripe} />
          {/* side mirrors */}
          <Rect x="23.5" y="25" width="4" height="6" rx="2" fill={body} />
          <Rect x="52.5" y="25" width="4" height="6" rx="2" fill={body} />
          {!stale ? <Path d="M40 4 L46 13 L34 13 Z" fill={colors.neel} stroke={colors.white} strokeWidth={2} strokeLinejoin="round" /> : null}
        </Svg>
      </Animated.View>
    </View>
  );
}
