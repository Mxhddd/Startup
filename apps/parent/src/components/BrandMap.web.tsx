// Web stand-in for the map (react-native-maps has no web version). Used only for the browser preview of the gallery.
import { mapColors } from '@pohnch/ui';
import { View } from 'react-native';

export function BrandMap({ accessibilityLabel }: { accessibilityLabel: string }) {
  return <View testID="parent-map" accessibilityLabel={accessibilityLabel} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: mapColors.land }} />;
}
