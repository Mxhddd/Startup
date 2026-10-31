// A family asking to join the van. The driver approves each one; nobody sees the van before that.
import { View } from 'react-native';
import { useLang } from '../lang';
import { colors, radius, space } from '../theme';
import { AppText } from './AppText';
import { TapButton } from './TapButton';

export function ApprovalCard({ child, stop, onApprove, onDecline }: { child: string; stop: string; onApprove: () => void; onDecline: () => void }) {
  const { t, dir } = useLang();
  return (
    <View testID="approval-card" style={{ backgroundColor: colors.white, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: space.lg, gap: space.md }}>
      <View style={{ gap: 2 }}>
        <AppText variant="small" bold color={colors.ink2}>
          {t('approval.title')}
        </AppText>
        <AppText variant="title">{t('approval.body', { child, stop })}</AppText>
      </View>
      <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', gap: space.md }}>
        <View style={{ flex: 1 }}>
          <TapButton tone="picked" label={t('approval.approve')} onConfirm={onApprove} testID="approve" />
        </View>
        <View style={{ flex: 1 }}>
          <TapButton label={t('approval.decline')} onConfirm={onDecline} testID="decline" />
        </View>
      </View>
    </View>
  );
}
