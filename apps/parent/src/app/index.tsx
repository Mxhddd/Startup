// Parent home (stage 1, empty state): the map fills the screen; the MapSheet holds today's trip.
// Until a van is joined, the sheet says how to connect one. B5 fills in the van, ETA and timeline.
// Long-press the sheet title to open the hidden component gallery.
import { colors, space, useLang } from '@pohnch/ui';
import { AppText, LangSwitch, MapSheet } from '@pohnch/ui/native';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMap } from '../components/BrandMap';

export default function ParentHome() {
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.ghee }}>
      <BrandMap accessibilityLabel={t('parent.map.label')} />

      <View style={{ position: 'absolute', top: insets.top + space.md, left: space.lg, right: space.lg, flexDirection: 'row', justifyContent: 'flex-end' }}>
        <LangSwitch />
      </View>

      <MapSheet peek={200} open={420} bottomInset={insets.bottom}>
        <View testID="trip-sheet" style={{ gap: space.sm }}>
          <Pressable onLongPress={() => router.push('/gallery')} accessibilityHint={t('gallery.open')}>
            <AppText variant="title">{t('parent.sheet.title')}</AppText>
          </Pressable>
          <AppText variant="secondary">{t('parent.sheet.empty')}</AppText>
        </View>
      </MapSheet>
    </View>
  );
}
