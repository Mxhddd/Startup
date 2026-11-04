// v12: the sky dresses for the weather and the season (Corridor's Sky draws these behind the arches).
//   RainStreaks  - thin slanted streaks falling (while it rains in Karachi: rain mode).
//   Clouds       - two soft clouds drifting across (rain and monsoon).
//   Moon         - a crescent with a soft glow at night (and through Ramadan).
//   Lanterns     - Ramadan and Eid: three hanging lanterns that sway a little.
//   Bunting      - 14 August: green and white flags strung across the top.
// All decoration only (hidden from screen readers). Reduce Motion: still.
import { useEffect } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Gradient } from './Gradient';
import { STAR_PATH } from './icons';

function useLoop(ms: number, delay = 0, reverse = false) {
  const v = useSharedValue(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    v.value = withDelay(delay, withRepeat(withTiming(1, { duration: ms, easing: reverse ? Easing.inOut(Easing.sin) : Easing.linear }), -1, reverse));
  }, [v, ms, delay, reverse, reduce]);
  return v;
}

const hidden = { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };

function Streak({ x, len, delay, height, color }: { x: number; len: number; delay: number; height: number; color: string }) {
  const v = useLoop(900 + (len % 5) * 90, delay);
  const s = useAnimatedStyle(() => ({ transform: [{ translateY: -len + v.value * (height + len) }, { translateX: -v.value * 40 }, { rotate: '14deg' }], opacity: 0.55 }));
  return <Animated.View style={[{ position: 'absolute', left: x, top: 0, width: 1.6, height: len, borderRadius: 1, backgroundColor: color }, s]} />;
}

/** `light`: pale streaks for a dark sky; otherwise blue-grey streaks that show on a bright one. */
export function RainStreaks({ height, light = false }: { height: number; light?: boolean }) {
  const { width } = useWindowDimensions();
  const n = Math.round(width / 16);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height, overflow: 'hidden' }} {...hidden}>
      {Array.from({ length: n }, (_, i) => (
        <Streak key={i} x={(i / n) * (width + 40) + ((i * 37) % 13)} len={14 + ((i * 7) % 12)} delay={(i * 131) % 900} height={height} color={light ? '#DCE6FF' : '#4F6AAE'} />
      ))}
    </View>
  );
}

function Cloud({ y, w, ms, delay, dark }: { y: number; w: number; ms: number; delay: number; dark: boolean }) {
  const { width } = useWindowDimensions();
  const v = useLoop(ms, delay);
  const s = useAnimatedStyle(() => ({ transform: [{ translateX: -w + v.value * (width + w) }] }));
  const c = dark ? '#2B3366' : '#F4F6FB';
  return (
    <Animated.View style={[{ position: 'absolute', left: 0, top: y, width: w, height: w * 0.42 }, s]}>
      <Svg width={w} height={w * 0.42} viewBox="0 0 100 42">
        <Path d="M12 40 C2 40 2 26 13 25 C13 13 30 9 37 18 C42 6 64 6 68 20 C78 14 92 20 89 31 C98 32 98 40 88 40 Z" fill={c} opacity={dark ? 0.75 : 0.55} />
      </Svg>
    </Animated.View>
  );
}

export function Clouds({ dark = false }: { dark?: boolean }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} {...hidden}>
      <Cloud y={52} w={170} ms={48_000} delay={0} dark={dark} />
      <Cloud y={118} w={120} ms={36_000} delay={9_000} dark={dark} />
    </View>
  );
}

/** A crescent: the lit disc with a sky-coloured disc over it, and a soft glow. */
export function Moon({ x, y, size = 34, sky }: { x: number; y: number; size?: number; sky: string }) {
  const glow = useLoop(4000, 0, true);
  const g = useAnimatedStyle(() => ({ opacity: 0.35 + 0.25 * glow.value, transform: [{ scale: 1 + 0.08 * glow.value }] }));
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x - size * 1.5, top: y - size * 1.5, width: size * 3, height: size * 3 }} {...hidden}>
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: size * 3, height: size * 3 }, g]}>
        <Gradient radial stops={[[0, '#DCE3FF', 0.6], [1, '#DCE3FF', 0]]} />
      </Animated.View>
      <Svg width={size * 3} height={size * 3} style={{ position: 'absolute' }}>
        <Circle cx={size * 1.5} cy={size * 1.5} r={size / 2} fill="#F6F1DE" />
        <Circle cx={size * 1.5 + size * 0.24} cy={size * 1.5 - size * 0.1} r={size * 0.44} fill={sky} />
      </Svg>
    </View>
  );
}

function Lantern({ x, len, delay }: { x: number; len: number; delay: number }) {
  const v = useLoop(2600 + delay, delay, true);
  const s = useAnimatedStyle(() => ({ transform: [{ rotate: `${-4 + 8 * v.value}deg` }] }));
  return (
    <Animated.View style={[{ position: 'absolute', left: x - 14, top: 0, width: 28, height: len + 44, transformOrigin: '50% 0%' }, s]}>
      <Svg width={28} height={len + 44}>
        <Defs>
          <RadialGradient id={`lg${x}`} cx="50%" cy="60%" r="60%">
            <Stop offset="0" stopColor="#FFE3A3" />
            <Stop offset="1" stopColor="#E8A33D" />
          </RadialGradient>
        </Defs>
        <Rect x={13.4} y={0} width={1.2} height={len} fill="#F2B95C" opacity={0.8} />
        <Path d={`M14 ${len} L22 ${len + 8} L22 ${len + 30} L14 ${len + 40} L6 ${len + 30} L6 ${len + 8} Z`} fill={`url(#lg${x})`} />
        <Path d={`M6 ${len + 8} H22 M6 ${len + 30} H22`} stroke="#8A5A12" strokeWidth={1.4} />
      </Svg>
    </Animated.View>
  );
}

export function Lanterns() {
  const { width } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 160 }} {...hidden}>
      <Lantern x={width * 0.14} len={44} delay={0} />
      <Lantern x={width * 0.86} len={70} delay={500} />
      <Lantern x={width * 0.7} len={26} delay={900} />
    </View>
  );
}

/** 14 August: a string of small green and white flags, each with a tiny star. */
export function Bunting({ top = 0 }: { top?: number }) {
  const { width } = useWindowDimensions();
  const n = Math.max(6, Math.round(width / 34));
  const sag = 26;
  const yAt = (f: number) => top + 10 + sag * 4 * f * (1 - f);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: top + 80 }} {...hidden}>
      <Svg width={width} height={top + 80}>
        <Path d={`M0 ${top + 10} Q${width / 2} ${top + 10 + sag * 2} ${width} ${top + 10}`} stroke="#F6F1DE" strokeWidth={1.2} fill="none" opacity={0.8} />
        {Array.from({ length: n }, (_, i) => {
          const f = (i + 0.5) / n;
          const x = f * width;
          const y = yAt(f);
          const green = i % 2 === 0;
          return (
            <G key={i} transform={`translate(${x - 9} ${y})`}>
              <Path d="M0 0 H18 L9 20 Z" fill={green ? '#01411C' : '#FFFFFF'} opacity={0.95} />
              {green ? <G transform="translate(6 4) scale(0.09)"><Path d={STAR_PATH} fill="#FFFFFF" fillRule="evenodd" /></G> : null}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
