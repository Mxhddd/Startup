// v24 (the Beaconhouse demo look): the morning as one line. Home on it, school at the end, the van riding
// along; the part already driven fills zamurrad. A stale signal greys the van instead of moving it.
// EtaTag: the big kesar minutes box ("12 min / to you"), the demo's one loud number.
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useLang } from '../lang';
import { colors, radius } from '../theme';
import { AppText } from './AppText';
import { Icon } from './icons';

export function TripTrack({ progress, homeAt = 0.4, stale = false, testID = 'trip-track' }: { progress: number; homeAt?: number; stale?: boolean; testID?: string }) {
  const { dir } = useLang();
  const p = Math.max(0, Math.min(1, progress));
  const rtl = dir === 'rtl';
  const pos = (f: number) => `${(rtl ? 1 - f : f) * 100}%` as const;
  const vanStyle = useAnimatedStyle(() => ({ left: withSpring(`${(rtl ? 1 - p : p) * 100}%` as unknown as number, { damping: 20, stiffness: 120 }) }));
  return (
    <View testID={testID} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(p * 100) }} style={{ height: 40, justifyContent: 'center', marginHorizontal: 14 }}>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.inset }} />
      <View style={{ position: 'absolute', height: 6, borderRadius: 3, backgroundColor: stale ? colors.ink2 : colors.zamurrad, width: `${p * 100}%`, [rtl ? 'right' : 'left']: 0 }} />
      <View style={{ position: 'absolute', left: pos(homeAt), marginLeft: -13, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.zamurrad, borderWidth: 3, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="home" size={13} color={colors.white} strokeWidth={2.6} />
      </View>
      <View style={{ position: 'absolute', left: pos(1), marginLeft: -13, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.kesar, borderWidth: 3, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="reachedSchool" size={13} color={colors.siyahi} strokeWidth={2.6} />
      </View>
      <Animated.View style={[{ position: 'absolute', marginLeft: -19, top: 3, transform: [{ scaleX: rtl ? -1 : 1 }] }, vanStyle]}>
        <Svg width={38} height={26} viewBox="0 0 38 26">
          <Rect x={2} y={4} width={34} height={16} rx={5} fill={stale ? colors.ink2 : colors.kesar} stroke={colors.siyahi} strokeWidth={2} />
          <Rect x={6} y={7} width={7} height={6} rx={1.5} fill="#DDE6F2" /><Rect x={15} y={7} width={7} height={6} rx={1.5} fill="#DDE6F2" />
          <Path d="M24 7h5c1.4 0 2.3.6 3 1.6L34 13H24Z" fill="#DDE6F2" />
          <Circle cx={10} cy={21} r={3.4} fill={colors.siyahi} /><Circle cx={28} cy={21} r={3.4} fill={colors.siyahi} />
        </Svg>
      </Animated.View>
    </View>
  );
}

export function EtaTag({ value, label, done = false, testID = 'eta-tag' }: { value: string; label?: string; done?: boolean; testID?: string }) {
  return (
    <View testID={testID} style={{ minWidth: 84, borderRadius: radius.button, borderCurve: 'continuous', paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center', backgroundColor: done ? colors.zamurrad : colors.kesar }}>
      <AppText variant="number" color={done ? colors.white : colors.siyahi} style={{ fontSize: 26, lineHeight: 30, writingDirection: 'ltr' }}>{value}</AppText>
      {label ? <AppText variant="small" bold color={done ? colors.white : colors.siyahi} numberOfLines={1}>{label}</AppText> : null}
    </View>
  );
}
