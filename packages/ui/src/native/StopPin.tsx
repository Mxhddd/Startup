// Pins on the map: an ordinary stop (white dot, neel ring), your stop (a zamurrad home pin),
// and the school (a kesar pin with the star). Parents only ever see their own stop and the school.
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme';
import { Icon, StarIcon } from './icons';

const PIN = 'M20 50 C20 50 4 31 4 19 a16 16 0 0 1 32 0 C36 31 20 50 20 50 Z';

export function StopPin({ kind }: { kind: 'stop' | 'home' | 'school' }) {
  if (kind === 'stop') {
    return (
      <Svg width={22} height={22} viewBox="0 0 22 22" testID="stop-pin">
        <Circle cx="11" cy="11" r="8" fill={colors.white} stroke={colors.neel} strokeWidth={4} />
      </Svg>
    );
  }
  const fill = kind === 'home' ? colors.zamurrad : colors.kesar;
  return (
    <View style={{ width: 40, height: 52 }} testID={`${kind}-pin`}>
      <Svg width={40} height={52} viewBox="0 0 40 52" style={{ position: 'absolute' }}>
        <Path d={PIN} fill={fill} stroke={colors.white} strokeWidth={2.5} />
      </Svg>
      <View style={{ position: 'absolute', top: 8, left: 9, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
        {kind === 'home' ? <Icon name="home" size={20} color={colors.white} strokeWidth={2.6} /> : <StarIcon size={22} color={colors.siyahi} />}
      </View>
    </View>
  );
}
