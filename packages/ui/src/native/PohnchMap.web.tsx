// Browser preview stand-in (MapLibre's native map has no web build here): a plain panel with the pins.
// Clicking places a point near the middle of Karachi.
import { Pressable, View } from 'react-native';
import { colors, karachiRegion, mapColors } from '../theme';
import { AppText } from './AppText';
import { StopPin } from './StopPin';
import { VanMarker } from './VanMarker';
import type { PohnchMapProps } from './PohnchMap';

export type { MapPin, PohnchMapProps } from './PohnchMap';

export function PohnchMap({ accessibilityLabel, pins = [], van, onPress, style, testID }: PohnchMapProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress ? () => onPress({ lat: karachiRegion.latitude + pins.length * 0.004, lng: karachiRegion.longitude + pins.length * 0.004 }) : undefined}
      style={[style ?? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, { backgroundColor: mapColors.land }]}
    >
      <View style={{ position: 'absolute', top: 140, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 28, flexWrap: 'wrap' }}>
        {van ? <VanMarker heading={van.heading ?? 90} stale={van.stale} /> : null}
        {pins.map((p) =>
          p.kind === 'number' ? (
            <View key={p.id} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.neel, alignItems: 'center', justifyContent: 'center' }}>
              <AppText variant="small" bold color={colors.white}>{String(p.n)}</AppText>
            </View>
          ) : (
            <StopPin key={p.id} kind={p.kind} />
          ),
        )}
      </View>
    </Pressable>
  );
}
