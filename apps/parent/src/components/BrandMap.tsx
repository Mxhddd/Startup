// The brand-styled map that fills the parent's screen. Android uses Google Maps with our colours;
// iPhone uses Apple Maps for now (styling it needs the Google Maps iOS SDK, decided in B4).
// The parent app never asks for the phone's location: showsUserLocation stays off.
import { googleMapStyle, karachiRegion } from '@pohnch/ui';
import { Platform, StyleSheet } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';

export function BrandMap({ accessibilityLabel }: { accessibilityLabel: string }) {
  return (
    <MapView
      testID="parent-map"
      accessibilityLabel={accessibilityLabel}
      style={StyleSheet.absoluteFill}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      customMapStyle={googleMapStyle}
      initialRegion={karachiRegion}
      showsUserLocation={false}
      showsMyLocationButton={false}
      toolbarEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
    />
  );
}
