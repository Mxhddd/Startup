// The van on the map: a neel circle with a ghee ring, a kesar van, and an arrow for its heading.
// Grey with no arrow when the signal is stale. The parent app places this inside a map Marker
// and glides it between positions (lerpLatLng in @pohnch/core).
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { headingDelta } from '@pohnch/core';
import { colors } from '../theme';

const GREY = '#8A8FA3';

export function VanMarker({ heading = 0, stale = false, size = 56 }: { heading?: number; stale?: boolean; size?: number }) {
  const rot = useSharedValue(heading);
  useEffect(() => {
    // Turn the short way round, e.g. 350° to 10° is +20°, not -340°.
    rot.value = withTiming(rot.value + headingDelta(rot.value % 360, heading), { duration: 600 });
  }, [heading, rot]);
  const arrow = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  const body = stale ? GREY : colors.neel;
  return (
    <View testID="van-marker" style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {!stale ? (
        <Animated.View style={[{ position: 'absolute', width: size, height: size }, arrow]}>
          <Svg width={size} height={size} viewBox="0 0 56 56">
            <Path d="M28 0 L35 10 L21 10 Z" fill={colors.neel} />
          </Svg>
        </Animated.View>
      ) : null}
      <Svg width={size} height={size} viewBox="0 0 56 56">
        <Circle cx="28" cy="30" r="19" fill={colors.ghee} />
        <Circle cx="28" cy="30" r="15" fill={body} />
        {/* the van glyph */}
        <Rect x="18" y="25" width="17" height="10" rx="2.5" fill={stale ? colors.ghee : colors.kesar} />
        <Path d="M35 27.5 h3 l2.5 3.5 v4 h-5.5 Z" fill={stale ? colors.ghee : colors.kesar} />
        <Circle cx="22" cy="36" r="2" fill={colors.ghee} />
        <Circle cx="35" cy="36" r="2" fill={colors.ghee} />
      </Svg>
    </View>
  );
}
