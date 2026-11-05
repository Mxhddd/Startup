// v12 illustrated empty scenes: a doorway (the arch) with a small scene inside, drawn in the brand's
// colours, above a calm line of words. Kinds: 'road' (no trips yet: a van waiting on an empty road under
// the sky), 'stars' (nothing today: the night with the star), 'family' (no children yet: three empty
// niches). Decoration only; the words carry the meaning.
import { useEffect, useId } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { archPath, colors } from '../theme';
import { AppText } from './AppText';
import { STAR_PATH } from './icons';


export function EmptyScene({ kind = 'road', title, body, testID }: { kind?: 'road' | 'stars' | 'family'; title: string; body?: string; testID?: string }) {
  const id = `es${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const w = 168;
  const h = 196;
  const v = useSharedValue(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!reduce) v.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [v, reduce]);
  const bob = useAnimatedStyle(() => ({ transform: [{ translateY: -3 * v.value }] }));
  return (
    <View testID={testID} style={{ alignItems: 'center', gap: 12, paddingVertical: 12 }}>
      <Animated.View style={bob} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Svg width={w} height={h}>
          <Defs>
            <ClipPath id={`${id}c`}><Path d={archPath(w, h)} /></ClipPath>
            <LinearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={kind === 'stars' ? '#0E1430' : '#2F62AE'} />
              <Stop offset="1" stopColor={kind === 'stars' ? '#26306A' : '#BFD9F0'} />
            </LinearGradient>
          </Defs>
          <G clipPath={`url(#${id}c)`}>
            <Rect x={0} y={0} width={w} height={h} fill={`url(#${id}s)`} />
            {kind === 'road' ? (
              <G>
                <Path d={`M0 ${h * 0.72} H${w} V${h} H0 Z`} fill={colors.sand} />
                <Path d={`M${w * 0.5 - 30} ${h} L${w * 0.5 - 6} ${h * 0.72} H${w * 0.5 + 6} L${w * 0.5 + 30} ${h} Z`} fill="#D9CFBC" />
                <Path d={`M${w * 0.5} ${h * 0.76} V${h * 0.8} M${w * 0.5} ${h * 0.86} V${h * 0.92}`} stroke={colors.kesar} strokeWidth={3} />
                {/* the van, waiting */}
                <G transform={`translate(${w * 0.5 - 26} ${h * 0.56})`}>
                  <Rect x={0} y={6} width={52} height={24} rx={7} fill={colors.kesar} />
                  <Rect x={6} y={0} width={34} height={14} rx={5} fill={colors.kesar} />
                  <Rect x={10} y={3} width={11} height={8} rx={2} fill="#FFF6E2" />
                  <Rect x={25} y={3} width={11} height={8} rx={2} fill="#FFF6E2" />
                  <Rect x={5} y={27} width={10} height={10} rx={5} fill={colors.siyahi} />
                  <Rect x={37} y={27} width={10} height={10} rx={5} fill={colors.siyahi} />
                </G>
              </G>
            ) : kind === 'stars' ? (
              <G>
                {[[0.2, 0.3], [0.7, 0.22], [0.35, 0.55], [0.8, 0.6], [0.55, 0.4]].map(([x, y], i) => (
                  <Rect key={i} x={(x as number) * w} y={(y as number) * h} width={3} height={3} rx={1.5} fill="#FFFFFF" opacity={0.8} />
                ))}
                <G transform={`translate(${w / 2 - 26} ${h * 0.5}) scale(0.8)`}><Path d={STAR_PATH} fill={colors.kesar} fillRule="evenodd" /></G>
              </G>
            ) : (
              <G>
                <Path d={`M0 ${h * 0.78} H${w} V${h} H0 Z`} fill={colors.sand} />
                {[0.18, 0.5, 0.82].map((fx, i) => (
                  <G key={i} transform={`translate(${fx * w - 18} ${h * 0.5})`}>
                    <Path d={archPath(36, 46)} fill={['#FBEBCF', '#DCEFE7', '#E6E9F5'][i]} opacity={0.95} />
                  </G>
                ))}
              </G>
            )}
          </G>
          <Path d={archPath(w, h)} fill="none" stroke={colors.kesar} strokeWidth={3} opacity={0.8} />
        </Svg>
      </Animated.View>
      <AppText bold align="center" style={{ fontSize: 18 }}>{title}</AppText>
      {body ? <AppText variant="secondary" align="center">{body}</AppText> : null}
    </View>
  );
}
