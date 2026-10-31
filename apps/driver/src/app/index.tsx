// Driver "Today" (stage 1, empty state). Driver screens are plain and high-contrast: no pattern, no frames.
// B4 fills this with today's stops in order, the chutti list and the Start trip button.
import { colors, space, useLang } from '@pohnch/ui';
import { AppText, LangSwitch } from '@pohnch/ui/native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DriverToday() {
  const { t, dir } = useLang();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.ghee, direction: dir, paddingTop: insets.top + space.lg, paddingHorizontal: space.xl }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.xl }}>
        <AppText variant="display" testID="today-title">{t('driver.today.title')}</AppText>
        <LangSwitch tone="dark" />
      </View>
      <View
        testID="today-empty"
        style={{ backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: space.xl, gap: space.sm }}
      >
        <AppText bold>{t('app.driver.name')}</AppText>
        <AppText variant="secondary">{t('driver.today.empty')}</AppText>
      </View>
    </View>
  );
}
