// The Pohnch mark (پہنچ with the kesar star as the dot of ن), drawn from the logo kit.
// animated: the letters rise in, then the star drops onto the ن, turning a quarter and settling with
// one bounce. It is the app's brand moment (login, first open), so it gets the most generous motion.
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { springs } from '../motion';
import { colors } from '../theme';
import { StarIcon } from './icons';
import { MARK_DOTS, MARK_GLYPHS, MARK_STAR, MARK_VIEWBOX } from './markPaths';

const VB = { x: -41, y: -1541, w: 1584, h: 1972 };

export function Logo({ width = 120, tone = 'neel', animated = false }: { width?: number; tone?: 'neel' | 'white'; animated?: boolean }) {
  const height = (width * VB.h) / VB.w;
  const ink = tone === 'white' ? colors.onBrand : colors.link;
  // Star placement in screen points.
  const starSpan = (MARK_STAR.size / VB.w) * width; // tip to tip
  const iconSize = (starSpan * 64) / 56; // StarIcon draws its star 56/64 of its box
  const cx = ((MARK_STAR.cx - VB.x) / VB.w) * width;
  const cy = ((-MARK_STAR.cy - VB.y) / VB.h) * height;

  const s = useSharedValue(animated ? 0 : 1);
  useEffect(() => {
    if (animated) s.value = withDelay(260, withSpring(1, springs.pop));
  }, [animated, s]);
  const star = useAnimatedStyle(() => ({
    opacity: Math.min(1, s.value * 1.5),
    transform: [{ translateY: (1 - s.value) * -height * 0.5 }, { rotate: `${(1 - s.value) * -90}deg` }, { scale: 0.4 + 0.6 * s.value }],
  }));

  const letters = (
    <Svg width={width} height={height} viewBox={MARK_VIEWBOX}>
      <G transform="scale(1,-1)">
        <G fill={ink}>
          {MARK_GLYPHS.map((g, i) => (
            <Path key={i} d={g.d} transform={`translate(${g.x} ${g.y})`} />
          ))}
          {MARK_DOTS.map((d, i) => (
            <Circle key={`d${i}`} cx={d.cx} cy={d.cy} r={d.r} />
          ))}
        </G>
      </G>
    </Svg>
  );

  return (
    <View accessibilityRole="image" accessibilityLabel="پہنچ Pohnch" style={{ width, height }}>
      {animated ? <Animated.View entering={FadeInDown.springify().damping(springs.layout.damping).stiffness(springs.layout.stiffness)}>{letters}</Animated.View> : letters}
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: cx - iconSize / 2, top: cy - iconSize / 2 }, star]}>
        <StarIcon size={iconSize} color={colors.kesar} />
      </Animated.View>
    </View>
  );
}
