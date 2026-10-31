// The van's status: verified by the Pohnch team, check pending, or switched off.
import { View } from 'react-native';
import { useLang } from '../lang';
import { colors, radius } from '../theme';
import { AppText } from './AppText';
import { StarIcon } from './icons';

const looks = {
  verified: { bg: colors.zamurradTint, fg: colors.zamurradOnTint, key: 'van.verified' },
  waiting: { bg: colors.kesarTint, fg: colors.siyahi, key: 'van.waiting' },
  off: { bg: colors.absentBg, fg: colors.absentText, key: 'van.off' },
} as const;

export function VanBadge({ status }: { status: keyof typeof looks }) {
  const { t, dir } = useLang();
  const l = looks[status];
  return (
    <View testID={`van-badge-${status}`} style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, alignSelf: dir === 'rtl' ? 'flex-end' : 'flex-start', backgroundColor: l.bg, borderRadius: radius.pill, paddingHorizontal: 12, minHeight: 32 }}>
      <StarIcon size={16} color={status === 'verified' ? colors.zamurrad : l.fg} />
      <AppText variant="small" bold color={l.fg}>
        {t(l.key)}
      </AppText>
    </View>
  );
}
