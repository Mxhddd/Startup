// v11 "Gehrai" (canvas "Z11P-Menu"): the parent page header as a corridor of three arches with the
// sky behind them, and a page you walk through as you scroll.
//
// What you see: a time-of-day sky (dawn, day, dusk, night) with a soft sun glow and a few stars;
// three walls with arched doorways, each farther wall lighter and hazier (air between them), each
// doorway with a darker band for the wall's thickness and a warm rim of light; the title floats in
// the sky. Below, light pools on the floor (FloorLight) and sunlight falls through a jali.
//
// How it moves (driven by the page's scroll, on the UI thread): the near arch grows past you and
// fades, the middle and far arches grow less (depth), the sky drifts up, the title rises and fades,
// and a slim frosted bar with the title takes over the top. Reduce Motion: no walk-through; the
// header simply scrolls away and the bar fades in.
import { karachiHour } from '@pohnch/core';
import { BlurView } from 'expo-blur';
import { useEffect } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, LinearGradient, Path, Pattern, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLang } from '../lang';
import { colorScheme, colors, mapMoodAt } from '../theme';
import { AppText } from './AppText';
import { Gradient } from './Gradient';
import { Icon, STAR_PATH } from './icons';
import { LangSwitch } from './LangSwitch';
import { PressableScale } from './PressableScale';

export type SkyMood = 'dawn' | 'day' | 'dusk' | 'night';

/** The sky's colours for each time of day (top to bottom). */
export const SKIES: Record<SkyMood, string[]> = {
  dawn: ['#1E2A63', '#5B4C8C', '#E39A6B', '#F6C9A0'],
  day: ['#1A3F86', '#2F62AE', '#6E9ED6', '#BFD9F0'],
  dusk: ['#141B40', '#4A3A78', '#C9765A', '#EFA978'],
  night: ['#070B1E', '#0E1430', '#1A2350', '#26306A'],
};

export function skyMoodNow(): SkyMood {
  if (colorScheme() === 'dark') return 'night';
  const m = mapMoodAt(karachiHour(new Date()));
  return m === 'morning' ? 'dawn' : m;
}

/** A pointed arch as an absolute path: doorway from x0, its point at y0, its foot at y0 + h. */
export function archAt(x0: number, y0: number, w: number, h: number, rise = w * 0.62): string {
  const a = x0 + w / 2;
  const n = (v: number) => Math.round(v * 10) / 10;
  return (
    `M${n(x0)} ${n(y0 + h)} L${n(x0)} ${n(y0 + rise)} C${n(x0)} ${n(y0 + rise * 0.48)} ${n(a - w * 0.2)} ${n(y0 + rise * 0.2)} ${n(a)} ${n(y0)} ` +
    `C${n(a + w * 0.2)} ${n(y0 + rise * 0.2)} ${n(x0 + w)} ${n(y0 + rise * 0.48)} ${n(x0 + w)} ${n(y0 + rise)} L${n(x0 + w)} ${n(y0 + h)} Z`
  );
}

export type WallSpec = { hole: number; top: number; fill: [string, string]; jamb: string; pattern: number };

// Atmospheric depth: farther walls are lighter and hazier. Hole widths are fractions of the screen.
export const WALLS: WallSpec[] = [
  { hole: 0.385, top: 122, fill: ['#7D7FB4', '#6C6FA6'], jamb: '#5B5E96', pattern: 0.05 },
  { hole: 0.58, top: 74, fill: ['#46529A', '#3B4689'], jamb: '#2C3672', pattern: 0.06 },
  { hole: 0.77, top: 34, fill: ['#1F2A5C', '#18214C'], jamb: '#0E1430', pattern: 0.08 },
];

let uid = 0;

function Wall({ w, h, spec, offset }: { w: number; h: number; spec: WallSpec; offset: number }) {
  return <WallShape w={w} h={h} spec={spec} offset={offset} />;
}

/** One wall with an arched doorway (exported for the welcome and join screens' tilt corridor). */
export function WallShape({ w, h, spec, offset = 0 }: { w: number; h: number; spec: WallSpec; offset?: number }) {
  const id = `w${++uid}`;
  const hw = w * spec.hole;
  const hole = archAt((w - hw) / 2, spec.top + offset, hw, h - spec.top - offset);
  const d = `M0 0 H${w} V${h} H0 Z ${hole}`;
  return (
    <Svg width={w} height={h} style={{ position: 'absolute', left: 0, top: 0 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Defs>
        <LinearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={spec.fill[0]} />
          <Stop offset="1" stopColor={spec.fill[1]} />
        </LinearGradient>
        <LinearGradient id={`${id}r`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#F2B95C" stopOpacity={0} />
          <Stop offset="0.5" stopColor="#F2B95C" stopOpacity={0.9} />
          <Stop offset="1" stopColor="#F2B95C" stopOpacity={0} />
        </LinearGradient>
        <Pattern id={`${id}p`} width={40} height={40} patternUnits="userSpaceOnUse">
          <G transform="translate(10 10) scale(0.3125)" opacity={spec.pattern}>
            <Path d={STAR_PATH} fill="#FFFFFF" fillRule="evenodd" />
          </G>
        </Pattern>
        <ClipPath id={`${id}c`}>
          <Path d={hole} />
        </ClipPath>
      </Defs>
      <Path d={d} fill={`url(#${id}g)`} fillRule="evenodd" />
      <Path d={d} fill={`url(#${id}p)`} fillRule="evenodd" />
      {/* The wall's thickness inside the doorway, then a warm rim of light on its edge. */}
      <Path d={hole} fill="none" stroke={spec.jamb} strokeWidth={18} clipPath={`url(#${id}c)`} opacity={0.9} />
      <Path d={hole} fill="none" stroke={`url(#${id}r)`} strokeWidth={2.5} />
    </Svg>
  );
}

function Twinkle({ x, y, r, delay }: { x: number; y: number; r: number; delay: number }) {
  const o = useSharedValue(0.3);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    o.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [o, delay, reduce]);
  const s = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ position: 'absolute', left: x, top: y, width: r, height: r, borderRadius: r, backgroundColor: '#FFFFFF' }, s]} />;
}

/** The sky, with the sun glowing low in the doorway (it breathes slowly) and stars at dawn and night. */
export function Sky({ height, mood }: { height: number; mood: SkyMood }) {
  const { width } = useWindowDimensions();
  const reduce = useReducedMotion();
  const glow = useSharedValue(1);
  useEffect(() => {
    if (reduce) return;
    glow.value = withRepeat(withTiming(1.08, { duration: 3000, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [glow, reduce]);
  const sun = useAnimatedStyle(() => ({ transform: [{ scale: glow.value }] }));
  const c = SKIES[mood];
  const sunColor = mood === 'night' ? '#AABEFF' : mood === 'day' ? '#FFF0C8' : '#FFD696';
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height, overflow: 'hidden' }}>
      <Gradient stops={[[0, c[0] as string], [0.38, c[1] as string], [0.78, c[2] as string], [1, c[3] as string]]} />
      {mood === 'dawn' || mood === 'night' || mood === 'dusk'
        ? [[0.15, 40, 2, 0], [0.33, 90, 3, 700], [0.56, 30, 2, 1400], [0.77, 70, 3, 300], [0.87, 140, 2, 2000], [0.23, 150, 2, 1100]].map(([fx, y, r, d], i) => (
            <Twinkle key={i} x={(fx as number) * width} y={y as number} r={r as number} delay={d as number} />
          ))
        : null}
      <Animated.View style={[{ position: 'absolute', left: width / 2 - 140, bottom: -110, width: 280, height: 280 }, sun]}>
        <Gradient radial stops={[[0, sunColor], [0.45, sunColor, 0.45], [1, sunColor, 0]]} />
      </Animated.View>
    </View>
  );
}

/** Where the doorway meets the page: the walls' soft shadow and warm light pooling on the floor. */
export function FloorLight({ mood }: { mood: SkyMood }) {
  const { width } = useWindowDimensions();
  const warm = mood === 'night' ? '#7888E6' : '#F6BE78';
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 140 }}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 56 }}>
        <Gradient stops={[[0, '#0E1430', 0.16], [1, '#0E1430', 0]]} />
      </View>
      <View style={{ position: 'absolute', left: width / 2 - 170, top: -40, width: 340, height: 170 }}>
        <Gradient radial stops={[[0, warm], [1, warm, 0]]} />
      </View>
    </View>
  );
}

export const BAR_HEIGHT = 56;

/**
 * The corridor header. Put it over an Animated.ScrollView whose content starts `corridorHeight()`
 * down, and pass that scroll's y. It shrinks as you scroll and hands over to a slim frosted bar.
 */
export function Corridor({ title, sub, scrollY, height, onBack, mood, accent, testID }: {
  title: string;
  sub?: string | null;
  scrollY: SharedValue<number>;
  height: number;
  onBack?: () => void;
  mood?: SkyMood;
  accent?: React.ReactNode;
  testID?: string;
}) {
  const { t, dir } = useLang();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const sky = mood ?? skyMoodNow();
  const bar = insets.top + BAR_HEIGHT;
  const travel = height - bar;
  const offset = insets.top;

  const frame = useAnimatedStyle(() => ({ height: Math.max(bar, height - Math.max(0, scrollY.value)) }));
  const wallStyle = (i: number) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => {
      if (reduce) return { transform: [{ translateY: -Math.min(travel, Math.max(0, scrollY.value)) * 0.4 }] };
      const p = Math.min(1, Math.max(0, scrollY.value / travel));
      const grow = [1.3, 1.75, 2.7][i] as number;
      return {
        opacity: i === 2 ? interpolate(p, [0, 0.8], [1, 0], 'clamp') : 1,
        transform: [{ scale: 1 + (grow - 1) * p }],
      };
    });
  const far = wallStyle(0);
  const mid = wallStyle(1);
  const near = wallStyle(2);
  const skyStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -Math.min(40, Math.max(0, scrollY.value) * 0.25) }] }));
  const titleStyle = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, scrollY.value / (travel * 0.55)));
    return { opacity: 1 - p, transform: [{ translateY: -40 * p }, { scale: 1 - 0.3 * p }] };
  });
  const barStyle = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, (scrollY.value - travel * 0.55) / (travel * 0.35)));
    return { opacity: p, transform: [{ translateY: 8 * (1 - p) }] };
  });
  const row = dir === 'rtl' ? 'row-reverse' : 'row';

  return (
    <Animated.View testID={testID} pointerEvents="box-none" style={[{ position: 'absolute', left: 0, right: 0, top: 0, overflow: 'hidden', zIndex: 5, backgroundColor: SKIES[sky][1] }, frame]}>
      <Animated.View style={[{ position: 'absolute', left: 0, right: 0, top: 0, height }, skyStyle]}>
        <Sky height={height} mood={sky} />
      </Animated.View>
      {/* The walls grow from a point low in the doorway, like walking toward it. */}
      {[far, mid, near].map((s, i) => (
        <Animated.View key={i} pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width, height, transformOrigin: '50% 78%' }, s]}>
          <Wall w={width} h={height} spec={WALLS[i] as WallSpec} offset={offset} />
        </Animated.View>
      ))}
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 24, right: 24, top: offset + height * 0.24, alignItems: 'center' }, titleStyle]} accessibilityRole="header">
        {accent ? <View style={{ marginBottom: 6 }}>{accent}</View> : null}
        <AppText variant="display" color={colors.onBrand} align="center" style={{ fontSize: 42, textShadowColor: 'rgba(10,15,38,0.6)', textShadowRadius: 18, textShadowOffset: { width: 0, height: 4 } }}>{title}</AppText>
        {sub ? <AppText color="rgba(250,246,238,0.9)" align="center" style={{ fontSize: 15, marginTop: -6, textShadowColor: 'rgba(10,15,38,0.6)', textShadowRadius: 10 }}>{sub}</AppText> : null}
      </Animated.View>
      {/* The slim bar that takes over once you've walked through. */}
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, top: 0, height: bar, overflow: 'hidden' }, barStyle]}>
        <BlurView intensity={40} tint="dark" style={{ flex: 1, backgroundColor: 'rgba(24,33,76,0.78)', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 14 }}>
          <AppText bold color={colors.onBrand} style={{ fontSize: 18 }} numberOfLines={1}>{title}</AppText>
        </BlurView>
      </Animated.View>
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 18, right: 18, top: offset + 6, height: 44, flexDirection: row, alignItems: 'center', justifyContent: 'space-between' }}>
        {onBack ? (
          <PressableScale accessibilityRole="button" accessibilityLabel={t('common.back')} scaleTo="chip" hitSlop={8} onPress={onBack}
            faceStyle={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(250,246,238,0.14)' }}>
            <View style={{ transform: [{ scaleX: dir === 'rtl' ? 1 : -1 }] }}>
              <Icon name="arrow" size={20} color={colors.onBrand} />
            </View>
          </PressableScale>
        ) : (
          <View />
        )}
        <LangSwitch tone="dark" />
      </View>
    </Animated.View>
  );
}
