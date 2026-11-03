// The row of quiet tiles at the bottom of the parent's sheet (v5): an icon over a word.
// Each one sinks and springs back when pressed; a tile that can't be used right now fades back.
import { colors, radius, useLang } from '@pohnch/ui';
import { AppText, Icon, PressableScale, type IconName } from '@pohnch/ui/native';
import { View } from 'react-native';

export type Tile = { key: string; label: string; icon: IconName; onPress: () => void; disabled?: boolean; on?: boolean; testID?: string };

export function ActionTiles({ tiles }: { tiles: Tile[] }) {
  const { dir } = useLang();
  return (
    <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', gap: 10 }}>
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
          faceStyle={{ minHeight: 78, borderRadius: radius.tile, backgroundColor: tile.on ? colors.neel : colors.sand, alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 }}
        >
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: tile.on ? 'rgba(250,246,238,0.16)' : colors.white, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={tile.icon} size={18} color={tile.on ? colors.ghee : colors.neel} strokeWidth={2.3} />
          </View>
          <AppText bold color={tile.on ? colors.ghee : colors.siyahi} align="center" style={{ fontSize: 15 }} numberOfLines={1}>
            {tile.label}
          </AppText>
        </PressableScale>
      ))}
    </View>
  );
}
