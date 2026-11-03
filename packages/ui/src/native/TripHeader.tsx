// The top of the driver's trip screen (v5): a neel band with the run and progress ("morning · 3/6 ·
// live"), Help (the one red button on the driver's screens), and below it the next stop in big type
// with how far it is. The count rolls when a stop is done; the live dot breathes.
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useLang } from '../lang';
import { durations } from '../motion';
import { colors, radius } from '../theme';
import { AppText } from './AppText';
import { Icon } from './icons';
import { PressableScale } from './PressableScale';
import { RollingText } from './RollingText';

function LiveDot({ color }: { color: string }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withRepeat(withTiming(1, { duration: durations.pulse / 2, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [v]);
  const s = useAnimatedStyle(() => ({ opacity: 0.55 + 0.45 * (1 - v.value), transform: [{ scale: 0.85 + 0.25 * v.value }] }));
  return <Animated.View style={[{ width: 9, height: 9, borderRadius: 5, borderCurve: 'continuous', backgroundColor: color }, s]} />;
}

export function TripHeader({
  kind,
  done,
  total,
  practice = false,
  onHelp,
  next,
  distance,
  topInset = 0,
}: {
  kind: 'morning' | 'afternoon';
  done: number;
  total: number;
  practice?: boolean;
  onHelp: () => void;
  /** The next stop's name, shown big. */
  next?: string;
  /** How far the next stop is ("350 m"), when the phone knows where the van is. */
  distance?: string;
  topInset?: number;
}) {
  const { t, dir } = useLang();
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  return (
    <Animated.View
      testID="trip-header"
      entering={FadeInUp.springify().damping(22)}
      style={{
        marginTop: topInset + 10,
        marginHorizontal: 14,
        backgroundColor: colors.neel,
        experimental_backgroundImage: `linear-gradient(180deg, ${colors.neelRaised}, ${colors.neel})`,
        paddingTop: 14,
        paddingHorizontal: 18,
        paddingBottom: 18,
        gap: 6,
        borderRadius: radius.big, borderCurve: 'continuous',
        boxShadow: '0px 16px 40px rgba(14,20,48,0.35)',
      }}
    >
      <View style={{ flexDirection: row, alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, flexDirection: row, alignItems: 'center', gap: 8 }}>
          <LiveDot color={practice ? colors.kesar : colors.pista} />
          <AppText bold color={colors.ghee} style={{ fontSize: 15 }}>
            {t(kind === 'morning' ? 'trip.morning' : 'trip.afternoon')}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <RollingText text={`${done}/${total}`} variant="number" color={colors.ghee} style={{ fontSize: 15, lineHeight: 22 }} />
          </View>
          {practice ? (
            <View style={{ backgroundColor: colors.kesar, borderRadius: radius.pill, borderCurve: 'continuous', paddingHorizontal: 10 }}>
              <AppText variant="small" bold color={colors.siyahi}>
                {t('trip.practice')}
              </AppText>
            </View>
          ) : null}
        </View>
        <PressableScale
          testID="help-button"
          accessibilityRole="button"
          accessibilityLabel={t('help.title')}
          onPress={onHelp}
          haptic="warn"
          scaleTo="chip"
          faceStyle={{ minHeight: 48, minWidth: 64, paddingHorizontal: 14, borderRadius: radius.button, borderCurve: 'continuous', backgroundColor: colors.shingarf, alignItems: 'center', justifyContent: 'center', flexDirection: row, gap: 6 }}
        >
          <Icon name="help" size={20} color={colors.white} />
          <AppText bold color={colors.white}>
            {t('help.title')}
          </AppText>
        </PressableScale>
      </View>
      {next ? (
        <View style={{ flexDirection: row, alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          {distance ? <RollingText text={distance} variant="number" color={colors.ghee} style={{ fontSize: 44, lineHeight: 52, letterSpacing: -1.2 }} /> : null}
          <AppText bold color={colors.ghee} style={{ fontSize: 22 }} numberOfLines={1}>
            {next}
          </AppText>
        </View>
      ) : (
        <AppText variant="small" color={colors.mutedOnDark}>
          {t('trip.progress', { done, total })}
        </AppText>
      )}
    </Animated.View>
  );
}
