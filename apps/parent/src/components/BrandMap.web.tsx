// Web stand-in for the map (react-native-maps has no web version), for the browser preview only.
// Clicking places a pin near the middle of Karachi.
import { colors, karachiRegion, mapColors } from '@pohnch/ui';
import { StopPin, VanMarker } from '@pohnch/ui/native';
import { Pressable, View } from 'react-native';
import type { MapProps } from './BrandMap';

export function BrandMap({ accessibilityLabel, van, stop, home, onPress, style }: MapProps) {
  return (
    <Pressable
      testID="parent-map"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress ? () => onPress({ lat: karachiRegion.latitude, lng: karachiRegion.longitude }) : undefined}
      style={[style ?? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, { backgroundColor: mapColors.land }]}
    >
      <View style={{ position: 'absolute', top: 150, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 40 }}>
        {van ? <VanMarker heading={van.heading ?? 90} stale={van.stale} /> : null}
        {stop ? <StopPin kind="stop" /> : null}
        {home ? <StopPin kind="home" /> : null}
      </View>
      <View style={{ position: 'absolute', top: 60, left: 0, right: 0, height: 6, backgroundColor: colors.white }} />
    </Pressable>
  );
}
