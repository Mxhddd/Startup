// Who is driving (v5): the driver's initial on a kesar disc with a thin gold ring, their name and the
// van, and the plate. Phone numbers are never shown in the app.
import { colors, radius, space, useLang } from '@pohnch/ui';
import { AppText } from '@pohnch/ui/native';
import { View } from 'react-native';

export function DriverCard({ driver, van, plate }: { driver: string | null; van: string | null; plate: string | null }) {
  const { dir } = useLang();
  const name = [driver, van].filter(Boolean).join(' · ');
  if (!name) return null;
  return (
    <View testID="driver-card" style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: space.md, padding: 10, paddingHorizontal: 12, backgroundColor: colors.ghee, borderRadius: radius.card }}>
      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.kesar, alignItems: 'center', justifyContent: 'center', boxShadow: `0px 0px 0px 3px ${colors.white}, 0px 0px 0px 4.5px ${colors.gold}` }}>
        <AppText bold color={colors.siyahi} style={{ fontSize: 20 }}>
          {(driver ?? van ?? '').slice(0, 1)}
        </AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText bold numberOfLines={1}>{name}</AppText>
        {plate ? (
          <AppText variant="number" color={colors.ink2} style={{ fontSize: 14, lineHeight: 20, textAlign: dir === 'rtl' ? 'right' : 'left' }}>
            {plate}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
