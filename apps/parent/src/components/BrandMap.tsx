// The brand-styled map that fills the parent's screen: the van (gliding, with its heading), your stop,
// and your home pin. Android uses Google Maps with our colours; iPhone uses Apple Maps for now.
// The parent app never reads the phone's location: showsUserLocation stays off. A home pin is placed
// by tapping the map (onPress).
import { googleMapStyle, karachiRegion } from '@pohnch/ui';
import { StopPin, VanMarker } from '@pohnch/ui/native';
import { useEffect, useRef } from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useGlide } from '../hooks/useGlide';

export type MapProps = {
  accessibilityLabel: string;
  van?: { lat: number; lng: number; heading: number | null; stale: boolean } | null;
  stop?: { lat: number; lng: number } | null;
  home?: { lat: number; lng: number } | null;
  onPress?: (p: { lat: number; lng: number }) => void;
  style?: object;
};

export function BrandMap({ accessibilityLabel, van, stop, home, onPress, style }: MapProps) {
  const map = useRef<MapView>(null);
  const vanAt = useGlide(van ? { latitude: van.lat, longitude: van.lng } : null);

  // Frame the van and your stop (or your home) when they first appear.
  const framed = useRef(false);
  useEffect(() => {
    const pts = [van && { latitude: van.lat, longitude: van.lng }, stop && { latitude: stop.lat, longitude: stop.lng }, home && { latitude: home.lat, longitude: home.lng }].filter(Boolean) as { latitude: number; longitude: number }[];
    if (framed.current || pts.length === 0) return;
    framed.current = true;
    if (pts.length === 1) map.current?.animateToRegion({ ...(pts[0] as { latitude: number; longitude: number }), latitudeDelta: 0.03, longitudeDelta: 0.03 }, 600);
    else map.current?.fitToCoordinates(pts, { edgePadding: { top: 120, bottom: 360, left: 60, right: 60 }, animated: true });
  }, [van, stop, home]);

  return (
    <MapView
      ref={map}
      testID="parent-map"
      accessibilityLabel={accessibilityLabel}
      style={style ?? StyleSheet.absoluteFill}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      customMapStyle={googleMapStyle}
      initialRegion={karachiRegion}
      showsUserLocation={false}
      showsMyLocationButton={false}
      toolbarEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
      onPress={onPress ? (e) => onPress({ lat: e.nativeEvent.coordinate.latitude, lng: e.nativeEvent.coordinate.longitude }) : undefined}
    >
      {home ? (
        <Marker coordinate={{ latitude: home.lat, longitude: home.lng }} anchor={{ x: 0.5, y: 1 }}>
          <StopPin kind="home" />
        </Marker>
      ) : null}
      {stop ? (
        <Marker coordinate={{ latitude: stop.lat, longitude: stop.lng }} anchor={{ x: 0.5, y: 0.5 }}>
          <StopPin kind="stop" />
        </Marker>
      ) : null}
      {vanAt && van ? (
        <Marker coordinate={vanAt} anchor={{ x: 0.5, y: 0.55 }} tracksViewChanges={false}>
          <VanMarker heading={van.heading ?? 0} stale={van.stale} />
        </Marker>
      ) : null}
    </MapView>
  );
}
