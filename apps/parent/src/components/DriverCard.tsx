// Who is driving (v5): the driver's initial on a kesar disc with a thin gold ring, their name and the
// van, and the plate. Phone numbers are never shown in the app.
import { colors, useLang } from '@pohnch/ui';
import { AppText } from '@pohnch/ui/native';
import { View } from 'react-native';

export function DriverCard({ driver, van, plate }: { driver: string | null; van: string | null; plate: string | null }) {
  const { dir } = useLang();
  const name = [driver, van].filter(Boolean).join(' · ');
  if (!name) return null;
  return (
    <View testID="driver-card" style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 14 }}>
      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.kesar, alignItems: 'center', justifyContent: 'center', boxShadow: `0px 0px 0px 3px ${colors.white}, 0px 0px 0px 4.5px ${colors.gold}` }}>
        <AppText bold color={colors.siyahi} style={{ fontSize: 21 }}>
          {(driver ?? van ?? '').slice(0, 1)}
        </AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText bold numberOfLines={1} style={{ fontSize: 17 }}>{driver ?? van}</AppText>
        {driver && van ? <AppText variant="small" color={colors.ink2} numberOfLines={1}>{van}</AppText> : null}
      </View>
      {plate ? (
        // Drawn like a number plate: white, a dark rim, spaced Latin letters.
        <View style={{ height: 34, paddingHorizontal: 10, borderRadius: 8, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.siyahi, justifyContent: 'center' }}>
          <AppText variant="number" style={{ fontSize: 14, lineHeight: 20, letterSpacing: 0.8 }}>{plate}</AppText>
        </View>
      ) : null}
    </View>
  );
}
