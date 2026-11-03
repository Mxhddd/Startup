// No signal. Driver side: how many taps wait on the phone. Parent side: when the van was last seen.
// Calm, not red: losing signal on Karachi roads is normal. It slides in and out instead of popping.
import { ageParts } from '@pohnch/core';
import { View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useLang } from '../lang';
import { springs } from '../motion';
import { colors, radius, shadow } from '../theme';
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
    <Animated.View
      testID="offline-banner"
      accessibilityRole="alert"
      entering={FadeInUp.springify().damping(springs.layout.damping)}
      exiting={FadeOutUp.duration(180)}
      style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 12, backgroundColor: colors.siyahi, borderRadius: radius.card, paddingHorizontal: 14, paddingVertical: 12, boxShadow: shadow.float }}
    >
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(232,163,61,0.16)', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="signal" size={20} color={colors.kesar} />
      </View>
      <View style={{ flex: 1 }}>
        {props.side === 'driver' ? (
          <AppText bold color={colors.ghee}>
            {t('offline.title')}
          </AppText>
        ) : null}
        <AppText variant={props.side === 'driver' ? 'small' : 'body'} bold={props.side === 'parent'} color={props.side === 'driver' ? colors.mutedOnDark : colors.ghee}>
          {text}
        </AppText>
      </View>
    </Animated.View>
  );
}
