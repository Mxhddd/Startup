// The row of quiet tiles at the bottom of the parent's sheet (v5): an icon over a word.
// Each one sinks and springs back when pressed; a tile that can't be used right now fades back.
import { colors, radius, useLang } from '@pohnch/ui';
import { AppText, Icon, PressableScale, type IconName } from '@pohnch/ui/native';
import { View } from 'react-native';

export type Tile = { key: string; label: string; icon: IconName; onPress: () => void; disabled?: boolean; on?: boolean; testID?: string };

export function ActionTiles({ tiles }: { tiles: Tile[] }) {
  const { dir } = useLang();
  return (
    <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', gap: 8 }}>
      {tiles.map((tile) => (
        <PressableScale
          key={tile.key}
          testID={tile.testID}
          accessibilityRole="button"
          accessibilityLabel={tile.label}
          accessibilityState={{ disabled: !!tile.disabled, selected: !!tile.on }}
          disabled={tile.disabled}
          onPress={tile.onPress}
          style={{ flex: 1, opacity: tile.disabled ? 0.45 : 1 }}
          faceStyle={{ minHeight: 60, borderRadius: radius.card, backgroundColor: tile.on ? colors.neel : colors.sand, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 6 }}
        >
          <Icon name={tile.icon} size={20} color={tile.on ? colors.ghee : colors.neel} />
          <AppText bold color={tile.on ? colors.ghee : colors.siyahi} align="center" style={{ fontSize: 14 }} numberOfLines={1}>
            {tile.label}
          </AppText>
        </PressableScale>
      ))}
    </View>
  );
}
