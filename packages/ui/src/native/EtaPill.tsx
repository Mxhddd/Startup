// The head of the parent's sheet (v6): who the van is coming for, then the minutes as one big number
// that rolls like an odometer, the words beside it, and the arrival time in a small kesar capsule.
// "At your door" replaces the number with a zamurrad line. Stale signal: everything goes grey.
import { View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useLang } from '../lang';
import { springs } from '../motion';
import { colors, radius, type } from '../theme';
import { AppText } from './AppText';
import { RollingNumber } from './RollingNumber';

export function EtaPill({
  minutes,
  to = 'home',
  stale = false,
  lead,
  clock,
}: {
  minutes: number | 'door';
  to?: 'home' | 'school';
  stale?: boolean;
  /** The line above ("Ali's van is coming"). */
  lead?: string;
  /** The arrival time, e.g. "7:15". */
  clock?: string;
}) {
  const { t, dir } = useLang();
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  const label = minutes === 'door' ? t('eta.door') : t(to === 'home' ? 'eta.home' : 'eta.school', { min: minutes });
  const ink = stale ? colors.ink2 : colors.siyahi;
  return (
    <View testID="eta-pill" accessibilityRole="text" accessibilityLabel={[lead, label, clock].filter(Boolean).join(' · ')} style={{ gap: 2 }}>
      {lead ? (
        <AppText bold color={colors.ink2} style={{ fontSize: 15 }}>
          {lead}
        </AppText>
      ) : null}
      <View style={{ flexDirection: row, alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        {minutes === 'door' ? (
          <Animated.View entering={ZoomIn.springify().damping(springs.pop.damping)}>
            <AppText bold color={stale ? colors.ink2 : colors.zamurrad} style={{ fontSize: 30, lineHeight: 48 }}>
              {label}
            </AppText>
          </Animated.View>
        ) : (
          // Digits read left to right even in Urdu; the words sit beside the number in reading order.
          <View style={{ flexDirection: row, alignItems: 'flex-end', gap: 10 }}>
            <RollingNumber value={minutes} size={type.hero} color={ink} />
            <AppText bold color={ink} style={{ fontSize: 24, paddingBottom: 10 }}>
              {t(to === 'home' ? 'eta.unit.home' : 'eta.unit.school')}
            </AppText>
          </View>
        )}
        {clock ? (
          <Animated.View entering={FadeIn.delay(250)} style={{ height: 34, paddingHorizontal: 12, borderRadius: radius.pill, borderCurve: 'continuous', backgroundColor: stale ? colors.absentBg : colors.kesarTint, justifyContent: 'center', marginBottom: 12 }}>
            <AppText variant="number" color={colors.siyahi} style={{ fontSize: 14, lineHeight: 20 }}>
              {t('eta.clock', { time: clock })}
            </AppText>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}
