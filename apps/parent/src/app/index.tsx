// Parent home (stage 1, empty state): the map fills the screen; the bottom sheet holds today's trip.
// Until a van is joined, the sheet says how to connect one. B5 fills in the van, ETA and timeline.
import { colors, radius, space, useLang } from '@pohnch/ui';
import { AppText, LangSwitch } from '@pohnch/ui/native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMap } from '../components/BrandMap';

export default function ParentHome() {
  const { t, dir } = useLang();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.ghee, direction: dir }}>
      <BrandMap accessibilityLabel={t('parent.map.label')} />

      <View style={{ position: 'absolute', top: insets.top + space.md, left: space.lg, right: space.lg, flexDirection: 'row', justifyContent: 'flex-end' }}>
        <LangSwitch />
      </View>

      <View
        testID="trip-sheet"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.ghee,
          borderTopLeftRadius: radius.sheet,
          borderTopRightRadius: radius.sheet,
          paddingHorizontal: space.xl,
          paddingTop: space.md,
          paddingBottom: insets.bottom + space.xl,
          gap: space.sm,
        }}
      >
        <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.line, marginBottom: space.sm }} />
        <AppText variant="title">{t('parent.sheet.title')}</AppText>
        <AppText variant="secondary">{t('parent.sheet.empty')}</AppText>
      </View>
    </View>
  );
}
