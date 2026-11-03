// The parent's map: the van (gliding between positions, with its heading), your stop and your home pin.
// Uses the shared key-free PohnchMap (MapLibre + OpenFreeMap). The parent app never reads the phone's
// location; a home pin is placed by tapping the map (onPress).
import { PohnchMap, type MapPin } from '@pohnch/ui/native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useGlide } from '../hooks/useGlide';

export type MapProps = {
  accessibilityLabel: string;
  van?: { lat: number; lng: number; heading: number | null; stale: boolean; speed?: number | null } | null;
  stop?: { lat: number; lng: number } | null;
  home?: { lat: number; lng: number } | null;
  onPress?: (p: { lat: number; lng: number }) => void;
  style?: StyleProp<ViewStyle>;
  bottomInset?: number;
  trail?: { lat: number; lng: number }[];
  follow?: boolean;
  onFollowChange?: (following: boolean) => void;
  recenterKey?: number;
};

export function BrandMap({ accessibilityLabel, van, stop, home, onPress, style, bottomInset, trail, follow, onFollowChange, recenterKey }: MapProps) {
  const vanAt = useGlide(van ? { latitude: van.lat, longitude: van.lng } : null);
  const pins: MapPin[] = [
    ...(home ? [{ id: 'home', kind: 'home' as const, lat: home.lat, lng: home.lng }] : []),
    ...(stop ? [{ id: 'stop', kind: 'stop' as const, lat: stop.lat, lng: stop.lng }] : []),
  ];
  return (
    <PohnchMap
      testID="parent-map"
      accessibilityLabel={accessibilityLabel}
      pins={pins}
      van={van && vanAt ? { lat: vanAt.latitude, lng: vanAt.longitude, heading: van.heading, stale: van.stale, speed: van.speed } : null}
      onPress={onPress}
      style={style}
      bottomInset={bottomInset}
      trail={trail && vanAt ? [...trail, { lat: vanAt.latitude, lng: vanAt.longitude }] : undefined}
      ahead={van && vanAt && stop ? [{ lat: vanAt.latitude, lng: vanAt.longitude }, stop] : undefined}
      follow={follow}
      onFollowChange={onFollowChange}
      recenterKey={recenterKey}
    />
  );
}
