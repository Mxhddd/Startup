// The driver's invite: one button makes the van's link (pohnch.pk/i/...) and code; v24 then shows them with
// Copy, WhatsApp and Share (ShareLink), so it works on every phone and in the browser.
import { View } from 'react-native';
import { useLang } from '../lang';
import { colors, radius, shadow, space } from '../theme';
import { AppText } from './AppText';
import { StarIcon } from './icons';
import { ShareLink } from './ShareLink';
import { TapButton } from './TapButton';

export function InviteCard({ onShare, link, message = '', note }: { onShare: () => void; link?: { url: string; code: string } | null; message?: string; note?: string | null }) {
  const { t, dir } = useLang();
  return (
    <View testID="invite-card" style={{ backgroundColor: colors.neel, borderRadius: radius.big, borderCurve: 'continuous', padding: space.xl, gap: space.md, boxShadow: shadow.card }}>
      <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 10 }}>
        <StarIcon size={28} color={colors.kesar} />
        <AppText variant="title" color={colors.onBrand}>
          {t('invite.title')}
        </AppText>
      </View>
      <AppText color={colors.mutedOnDark}>{t('invite.body')}</AppText>
      {note ? <AppText variant="small" color={colors.mutedOnDark}>{note}</AppText> : null}
      {link ? <ShareLink url={link.url} code={link.code} message={message} testID="invite-link" /> : <TapButton tone="reachedSchool" label={t('invite.share')} onConfirm={onShare} testID="invite-share" />}
    </View>
  );
}
