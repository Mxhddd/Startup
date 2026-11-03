// The map for placing stops: tap to add one; existing stops show as numbered pins.
// Uses the shared key-free PohnchMap (MapLibre + OpenFreeMap): no Google key or billing.
import { colors } from '@pohnch/ui';
import { PohnchMap } from '@pohnch/ui/native';
import { View } from 'react-native';

export type StopPinData = { id: string; lat: number; lng: number; n: number };

export function DriverMap({ pins, onPress, height = 300 }: { pins: StopPinData[]; onPress: (p: { lat: number; lng: number }) => void; height?: number }) {
  return (
    <View style={{ height, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: colors.siyahi }}>
      <PohnchMap testID="stops-map" accessibilityLabel="stops map" pins={pins.map((p) => ({ ...p, kind: 'number' as const }))} onPress={onPress} style={{ flex: 1 }} />
    </View>
  );
}
