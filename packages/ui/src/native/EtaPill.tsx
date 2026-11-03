// The head of the parent's sheet (v5): who the van is coming for, then minutes to your door (or to
// school) in big type, and the arrival clock at the end. The minutes roll when they change.
// When the van's signal is stale the minutes go grey: we don't pretend to know.
import { View } from 'react-native';
import { useLang } from '../lang';
import { colors } from '../theme';
import { AppText } from './AppText';
import { RollingText } from './RollingText';

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
  const text = minutes === 'door' ? t('eta.door') : t(to === 'home' ? 'eta.home' : 'eta.school', { min: minutes });
  const big = stale ? colors.ink2 : minutes === 'door' ? colors.zamurrad : colors.siyahi;
  return (
    <View testID="eta-pill" accessibilityRole="text" accessibilityLabel={[lead, text, clock].filter(Boolean).join(' · ')} style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 12 }}>
      <View style={{ flex: 1 }}>
        {lead ? (
          <AppText bold color={colors.ink2} style={{ fontSize: 15 }}>
            {lead}
          </AppText>
        ) : null}
        <RollingText text={text} bold color={big} style={{ fontSize: 30, lineHeight: 44 }} />
      </View>
      {clock ? (
        <AppText variant="number" color={colors.ink2} style={{ fontSize: 15, lineHeight: 22, paddingBottom: 8 }}>
          {t('eta.clock', { time: clock })}
        </AppText>
      ) : null}
    </View>
  );
}
