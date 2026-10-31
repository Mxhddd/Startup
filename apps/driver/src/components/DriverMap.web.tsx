// Browser preview stand-in: a plain panel; clicking adds a stop near the middle of Karachi.
import { colors, mapColors, karachiRegion } from '@pohnch/ui';
import { AppText } from '@pohnch/ui/native';
import { Pressable, View } from 'react-native';
import type { MapPin } from './DriverMap';

export type { MapPin };

export function DriverMap({ pins, onPress, height = 300 }: { pins: MapPin[]; onPress: (p: { lat: number; lng: number }) => void; height?: number }) {
  return (
    <Pressable testID="stops-map" onPress={() => onPress({ lat: karachiRegion.latitude + pins.length * 0.004, lng: karachiRegion.longitude + pins.length * 0.004 })}
      style={{ height, borderRadius: 16, backgroundColor: mapColors.land, borderWidth: 2, borderColor: colors.siyahi, flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16, alignContent: 'flex-start' }}>
      {pins.map((p) => (
        <View key={p.id} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.neel, alignItems: 'center', justifyContent: 'center' }}>
          <AppText variant="small" bold color={colors.white}>{String(p.n)}</AppText>
        </View>
      ))}
    </Pressable>
  );
}
