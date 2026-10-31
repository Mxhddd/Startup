// Minutes to your door (or to school), on top of the parent's sheet. Digits always in Manrope.
// When the van's signal is stale the pill turns grey: we don't pretend to know.
import { View } from 'react-native';
import { useLang } from '../lang';
import { colors, radius } from '../theme';
import { AppText } from './AppText';
import { StarIcon } from './icons';

export function EtaPill({ minutes, to = 'home', stale = false }: { minutes: number | 'door'; to?: 'home' | 'school'; stale?: boolean }) {
  const { t, dir } = useLang();
  const text = minutes === 'door' ? t('eta.door') : t(to === 'home' ? 'eta.home' : 'eta.school', { min: minutes });
  const bg = stale ? colors.absentBg : minutes === 'door' ? colors.zamurrad : colors.neel;
  const fg = stale ? colors.absentText : colors.ghee;
  return (
    <View
      testID="eta-pill"
      accessibilityRole="text"
      accessibilityLabel={text}
      style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 10, alignSelf: dir === 'rtl' ? 'flex-end' : 'flex-start', backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: 18, minHeight: 48 }}
    >
      <StarIcon size={20} color={stale ? colors.absentText : colors.kesar} />
      <AppText bold color={fg} style={{ fontSize: 18 }}>
        {text}
      </AppText>
    </View>
  );
}
