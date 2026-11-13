// The parent's map: the van (gliding between positions inside PohnchMap, v21), your stop and your home pin.
// Uses the shared key-free PohnchMap (MapLibre + OpenFreeMap). The parent app never reads the phone's
// location; a home pin is placed by tapping the map (onPress).
import { PohnchMap, type MapPin } from '@pohnch/ui/native';
import type { StyleProp, ViewStyle } from 'react-native';

export type MapProps = {
  accessibilityLabel: string;
  van?: { lat: number; lng: number; heading: number | null; stale: boolean; speed?: number | null; waiting?: boolean } | null;
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
  const pins: MapPin[] = [
    ...(home ? [{ id: 'home', kind: 'home' as const, lat: home.lat, lng: home.lng }] : []),
    ...(stop ? [{ id: 'stop', kind: 'stop' as const, lat: stop.lat, lng: stop.lng }] : []),
  ];
  return (
    <PohnchMap
      testID="parent-map"
      accessibilityLabel={accessibilityLabel}
      pins={pins}
      van={van ?? null}
      onPress={onPress}
      style={style}
      bottomInset={bottomInset}
      trail={trail && van ? [...trail, { lat: van.lat, lng: van.lng }] : undefined}
      ahead={van && stop ? [{ lat: van.lat, lng: van.lng }, stop] : undefined}
      follow={follow}
      onFollowChange={onFollowChange}
      recenterKey={recenterKey}
    />
  );
}
