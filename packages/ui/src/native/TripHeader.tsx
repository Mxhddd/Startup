// The top of the driver's trip screen: morning or afternoon, how many children are done, and Help.
// Help is the one red button on the driver's screens.
import { Pressable, View } from 'react-native';
import { useLang } from '../lang';
import { colors, radius } from '../theme';
import { AppText } from './AppText';
import { Icon } from './icons';

export function TripHeader({
  kind,
  done,
  total,
  practice = false,
  onHelp,
}: {
  kind: 'morning' | 'afternoon';
  done: number;
  total: number;
  practice?: boolean;
  onHelp: () => void;
}) {
  const { t, dir } = useLang();
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  return (
    <View testID="trip-header" style={{ flexDirection: row, alignItems: 'center', gap: 12, paddingVertical: 8 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: row, alignItems: 'center', gap: 8 }}>
          <AppText variant="title">{t(kind === 'morning' ? 'trip.morning' : 'trip.afternoon')}</AppText>
          {practice ? (
            <View style={{ backgroundColor: colors.kesarTint, borderRadius: radius.pill, paddingHorizontal: 10 }}>
              <AppText variant="small" bold color={colors.siyahi}>
                {t('trip.practice')}
              </AppText>
            </View>
          ) : null}
        </View>
        <AppText variant="secondary">{t('trip.progress', { done, total })}</AppText>
      </View>
      <Pressable
        testID="help-button"
        accessibilityRole="button"
        accessibilityLabel={t('help.title')}
        onPress={onHelp}
        style={({ pressed }) => ({
          minHeight: 64,
          minWidth: 64,
          paddingHorizontal: 16,
          borderRadius: radius.button,
          backgroundColor: colors.shingarf,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: row,
          gap: 8,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Icon name="help" size={24} color={colors.white} />
        <AppText bold color={colors.white}>
          {t('help.title')}
        </AppText>
      </Pressable>
    </View>
  );
}
