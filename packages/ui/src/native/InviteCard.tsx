// The driver's invite: one button that shares the van's link (pohnch.pk/i/...) to the families' WhatsApp group.
// The link itself is never printed on screen or logged; the share sheet carries it.
import { View } from 'react-native';
import { useLang } from '../lang';
import { colors, radius, space } from '../theme';
import { AppText } from './AppText';
import { StarIcon } from './icons';
import { TapButton } from './TapButton';

export function InviteCard({ onShare }: { onShare: () => void }) {
  const { t, dir } = useLang();
  return (
    <View testID="invite-card" style={{ backgroundColor: colors.neel, borderRadius: radius.card, padding: space.xl, gap: space.md }}>
      <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 10 }}>
        <StarIcon size={28} color={colors.kesar} />
        <AppText variant="title" color={colors.ghee}>
          {t('invite.title')}
        </AppText>
      </View>
      <AppText color={colors.neelTint}>{t('invite.body')}</AppText>
      <TapButton tone="reachedSchool" label={t('invite.share')} onConfirm={onShare} testID="invite-share" />
    </View>
  );
}
