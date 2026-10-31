// The map for placing stops: tap to add one; existing stops show as numbered pins.
import { googleMapStyle, karachiRegion, colors } from '@pohnch/ui';
import { AppText } from '@pohnch/ui/native';
import { Platform, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export type MapPin = { id: string; lat: number; lng: number; n: number };

export function DriverMap({ pins, onPress, height = 300 }: { pins: MapPin[]; onPress: (p: { lat: number; lng: number }) => void; height?: number }) {
  const first = pins[0];
  return (
    <View style={{ height, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: colors.siyahi }}>
      <MapView
        testID="stops-map"
        style={{ flex: 1 }}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={googleMapStyle}
        initialRegion={first ? { latitude: first.lat, longitude: first.lng, latitudeDelta: 0.04, longitudeDelta: 0.04 } : karachiRegion}
        onPress={(e) => onPress({ lat: e.nativeEvent.coordinate.latitude, lng: e.nativeEvent.coordinate.longitude })}
        showsUserLocation={false}
        toolbarEnabled={false}
      >
        {pins.map((p) => (
          <Marker key={p.id} coordinate={{ latitude: p.lat, longitude: p.lng }} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.neel, borderWidth: 3, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' }}>
              <AppText variant="small" bold color={colors.white}>{String(p.n)}</AppText>
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}
