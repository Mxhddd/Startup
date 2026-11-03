// Parent home: the map fills the screen; the MapSheet holds today's trip for the selected child.
// Long-press the sheet's grab area title to open the hidden component gallery.
import { colors, radius, space, useLang } from '@pohnch/ui';
import { AppText, LangSwitch, MapSheet } from '@pohnch/ui/native';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMap } from '../components/BrandMap';
import { TripSheet } from '../components/TripSheet';
import { useParent } from '../state/ParentStore';

export default function ParentHome() {
  const { t, dir } = useLang();
  const insets = useSafeAreaInsets();
  const p = useParent();
  const live = p.phase === 'live' && p.position;
  return (
    <View style={{ flex: 1, backgroundColor: colors.ghee }}>
      <BrandMap
        accessibilityLabel={t('parent.map.label')}
        van={live && p.position ? { lat: p.position.lat, lng: p.position.lng, heading: p.position.heading, stale: p.signal?.stale ?? false } : null}
        stop={p.stop ? { lat: p.stop.lat, lng: p.stop.lng } : null}
        home={p.child?.lat != null && p.child.lng != null ? { lat: p.child.lat, lng: p.child.lng } : null}
        bottomInset={240}
      />

      <View style={{ position: 'absolute', top: insets.top + space.md, left: space.lg, right: space.lg, flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', justifyContent: 'space-between' }}>
        <Pressable accessibilityRole="button" onPress={() => router.push('/family')} onLongPress={() => router.push('/gallery')} accessibilityHint={t('gallery.open')}
          style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, justifyContent: 'center' }}>
          <AppText bold color={colors.neel}>{t('parent.menu')}</AppText>
        </Pressable>
        <LangSwitch />
      </View>

      <MapSheet peek={240} open={520} bottomInset={insets.bottom}>
        <TripSheet />
      </MapSheet>
    </View>
  );
}
