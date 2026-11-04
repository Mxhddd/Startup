// v11 "Gehrai": depth and light under and around the content.
//   LivingGround - the page is lit, not flat: a warm and a cool light drift slowly under it.
//   JaliLight    - sunlight through a jali (lattice): star-shaped light on the floor, sliding slowly.
//   Niche        - a child as a carved mehrab: lit rim, shadowed inner arch, floating very gently.
//   useTilt      - the phone's tilt, for parallax on brand screens (welcome, join card, story).
// Reduce Motion: everything holds still.
import { DeviceMotion } from 'expo-sensors';
import { useEffect } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Defs, G, LinearGradient, Mask, Path, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';
import { archPath, colorScheme, colors } from '../theme';
import { AppText } from './AppText';
import { Gradient } from './Gradient';
import { STAR_PATH } from './icons';

function useDrift(ms: number, delay = 0) {
  const v = useSharedValue(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    v.value = withDelay(delay, withRepeat(withTiming(1, { duration: ms, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [v, ms, delay, reduce]);
  return v;
}

/** Two soft lights drifting under the page (warm kesar high, cool neel low). Absolute fill. */
export function LivingGround() {
  const { width, height } = useWindowDimensions();
  const a = useDrift(7000);
  const b = useDrift(9000, 1200);
  const night = colorScheme() === 'dark';
  const warm = useAnimatedStyle(() => ({ transform: [{ translateX: -40 * a.value }, { translateY: 30 * a.value }, { scale: 1 + 0.15 * a.value }] }));
  const cool = useAnimatedStyle(() => ({ transform: [{ translateX: 50 * b.value }, { translateY: -20 * b.value }, { scale: 1.1 - 0.2 * b.value }] }));
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: colors.ghee, overflow: 'hidden' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[{ position: 'absolute', left: -80, top: height * 0.3, width: 340, height: 340 }, warm]}>
        <Gradient radial stops={[[0, '#E8A33D', night ? 0.1 : 0.22], [1, '#E8A33D', 0]]} />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', left: width - 270, top: height * 0.62, width: 380, height: 380 }, cool]}>
        <Gradient radial stops={[[0, night ? '#7888E6' : '#1F2A5C', night ? 0.14 : 0.1], [1, '#1F2A5C', 0]]} />
      </Animated.View>
    </View>
  );
}

/** Sunlight through a jali on the floor just below the doorway. It slides slowly and fades away down the
 * page and toward the sides (an svg mask, so it blends with whatever light is under it). */
export function JaliLight({ height = 200 }: { height?: number }) {
  const { width } = useWindowDimensions();
  const v = useDrift(9000);
  const slide = useAnimatedStyle(() => ({ transform: [{ translateX: -44 * v.value }] }));
  const w = width + 120;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 6, height, overflow: 'hidden' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[{ position: 'absolute', left: -60, top: 0 }, slide]}>
        <Svg width={w} height={height}>
          <Defs>
            <Pattern id="jali" width={44} height={44} patternUnits="userSpaceOnUse">
              <G transform="translate(12 12) scale(0.3125)">
                <Path d={STAR_PATH} fill="#F2B95C" fillOpacity={0.32} fillRule="evenodd" />
              </G>
            </Pattern>
            <RadialGradient id="jaliFade" cx="50%" cy="0%" rx="38%" ry="100%">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </RadialGradient>
            <Mask id="jaliMask" x="0" y="0" width={w} height={height} maskUnits="userSpaceOnUse">
              <Rect x="0" y="0" width={w} height={height} fill="url(#jaliFade)" />
            </Mask>
          </Defs>
          <Rect x="0" y="0" width={w} height={height} fill="url(#jali)" mask="url(#jaliMask)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

let nid = 0;
/**
 * A child as a carved niche (mehrab): the outer arch catches light on its rim, the inner arch is set
 * back in shadow in the child's colour, the initial sits inside. It floats very gently (Reduce Motion: still).
 */
export function Niche({ letter, fill, ink, width = 100, height = 122, delay = 0, floating = true }: { letter: string; fill: string; ink: string; width?: number; height?: number; delay?: number; floating?: boolean }) {
  const id = `n${++nid}`;
  const bob = useDrift(2500, delay);
  const style = useAnimatedStyle(() => (floating ? { transform: [{ translateY: -5 * bob.value }, { rotate: `${-0.6 + 1.2 * bob.value}deg` }] } : {}));
  const iw = width - 22;
  const ih = height - 22;
  const fin = 5;
  return (
    <Animated.View style={[{ width, height, boxShadow: '0px 16px 20px -12px rgba(31,42,92,0.30)' }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={height + fin} viewBox={`0 ${-fin} ${width} ${height + fin}`} style={{ position: 'absolute', top: -fin, left: 0 }}>
        <Defs>
          <LinearGradient id={`${id}o`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colorScheme() === 'dark' ? '#2A3466' : '#FFFFFF'} />
            <Stop offset="1" stopColor={colorScheme() === 'dark' ? '#1A2250' : '#EFE7D7'} />
          </LinearGradient>
          <LinearGradient id={`${id}i`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={fill} stopOpacity={0.82} />
            <Stop offset="1" stopColor={fill} />
          </LinearGradient>
        </Defs>
        <Path d={archPath(width, height)} fill={`url(#${id}o)`} />
        <G transform="translate(11 14)">
          <Path d={archPath(iw, ih)} fill={`url(#${id}i)`} />
          <Path d={archPath(iw, ih)} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth={3} />
        </G>
      </Svg>
      <View style={{ position: 'absolute', left: 0, right: 0, top: height * 0.38, alignItems: 'center' }}>
        <AppText bold color={ink} style={{ fontSize: Math.round(width * 0.33), lineHeight: Math.round(width * 0.48), textShadowColor: 'rgba(0,0,0,0.18)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 2 } }}>{letter}</AppText>
      </View>
    </Animated.View>
  );
}

/**
 * The phone's tilt as two springy values in -1..1 (left/right, toward/away), for parallax. Off (zero)
 * with Reduce Motion, on the web, or when the sensor isn't there. Reads only motion, never location.
 */
export function useTilt(): { x: SharedValue<number>; y: SharedValue<number> } {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce || Platform.OS === 'web') return;
    let sub: { remove: () => void } | null = null;
    let alive = true;
    DeviceMotion.isAvailableAsync()
      .then((ok) => {
        if (!ok || !alive) return;
        DeviceMotion.setUpdateInterval(50);
        sub = DeviceMotion.addListener((m) => {
          const r = m.rotation;
          if (!r) return;
          // gamma: left/right, beta: toward/away (radians); ~30 degrees of tilt is full parallax.
          x.value = withSpring(Math.max(-1, Math.min(1, r.gamma / 0.5)), { damping: 20, stiffness: 120 });
          y.value = withSpring(Math.max(-1, Math.min(1, (r.beta - 0.7) / 0.5)), { damping: 20, stiffness: 120 });
        });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
      sub?.remove();
    };
  }, [x, y, reduce]);
  return { x, y };
}

/** A layer that moves with the tilt by `depth` pixels (far layers a little, near ones more). */
export function TiltLayer({ tilt, depth, children, style }: { tilt: { x: SharedValue<number>; y: SharedValue<number> }; depth: number; children: React.ReactNode; style?: object }) {
  const s = useAnimatedStyle(() => ({ transform: [{ translateX: tilt.x.value * depth }, { translateY: tilt.y.value * depth * 0.4 }] }));
  return <Animated.View style={[style, s]}>{children}</Animated.View>;
}
