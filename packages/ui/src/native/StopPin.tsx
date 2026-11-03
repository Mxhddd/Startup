// Pins on the map, as on the v5 screens: an ordinary stop (white dot, neel ring), your stop or home
// (a zamurrad dot with a soft halo), and the school (a kesar disc with the house glyph in siyahi).
// Each one drops in on a spring when it first appears.
import { View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { springs } from '../motion';
import { colors } from '../theme';

const enter = ZoomIn.springify().damping(springs.pop.damping).stiffness(springs.pop.stiffness);

export function StopPin({ kind }: { kind: 'stop' | 'home' | 'school' }) {
  if (kind === 'stop') {
    return (
      <Animated.View entering={enter} testID="stop-pin">
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="8" fill={colors.white} stroke={colors.link} strokeWidth={4} />
        </Svg>
      </Animated.View>
    );
  }
  if (kind === 'home') {
    return (
      <Animated.View entering={enter} testID="home-pin" style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', width: 52, height: 52, borderRadius: 26, borderCurve: 'continuous', backgroundColor: colors.zamurrad, opacity: 0.18 }} />
        <View style={{ width: 28, height: 28, borderRadius: 14, borderCurve: 'continuous', backgroundColor: colors.zamurrad, borderWidth: 4.5, borderColor: colors.white, boxShadow: '0px 2px 6px rgba(20,26,51,0.25)' }} />
      </Animated.View>
    );
  }
  return (
    <Animated.View entering={enter} testID="school-pin" style={{ width: 44, height: 44, boxShadow: '0px 3px 8px rgba(20,26,51,0.25)', borderRadius: 22, borderCurve: 'continuous' }}>
      <Svg width={44} height={44} viewBox="0 0 44 44">
        <Circle cx="22" cy="22" r="19" fill={colors.kesar} stroke={colors.white} strokeWidth={4} />
        <Path d="M14 28 V19.5 l8 -5.5 8 5.5 V28 Z" fill={colors.siyahi} />
      </Svg>
    </Animated.View>
  );
}
