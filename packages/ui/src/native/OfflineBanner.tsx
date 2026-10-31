// No signal. Driver side: how many taps wait on the phone. Parent side: when the van was last seen.
// Calm, not red: losing signal on Karachi roads is normal.
import { ageParts } from '@pohnch/core';
import { View } from 'react-native';
import { useLang } from '../lang';
import { colors, radius } from '../theme';
import { AppText } from './AppText';
import { Icon } from './icons';

export function OfflineBanner(props: { side: 'driver'; queued: number } | { side: 'parent'; secondsAgo: number }) {
  const { t, dir } = useLang();
  const ageText = (s: number) => {
    const a = ageParts(s);
    return t(`age.${a.unit}`, { n: a.n });
  };
  const text = props.side === 'driver' ? t('offline.queued', { n: props.queued }) : t('offline.parent', { age: ageText(props.secondsAgo) });
  return (
    <View
      testID="offline-banner"
      accessibilityRole="alert"
      style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 12, backgroundColor: colors.siyahi, borderRadius: radius.card, paddingHorizontal: 16, paddingVertical: 12 }}
    >
      <Icon name="signal" size={22} color={colors.kesar} />
      <View style={{ flex: 1 }}>
        {props.side === 'driver' ? (
          <AppText bold color={colors.ghee}>
            {t('offline.title')}
          </AppText>
        ) : null}
        <AppText variant={props.side === 'driver' ? 'small' : 'body'} color={colors.ghee}>
          {text}
        </AppText>
      </View>
    </View>
  );
}
