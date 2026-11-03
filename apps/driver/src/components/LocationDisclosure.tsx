// Google Play requires a clear in-app explanation before an app asks for background location.
// Shown once, before the driver's first real trip; the phone's own permission prompt comes after "continue".
import { colors, radius, space, useLang } from '@pohnch/ui';
import { AppText, TapButton } from '@pohnch/ui/native';
import { Modal, View } from 'react-native';

export function LocationDisclosure({ visible, onAccept, onDecline }: { visible: boolean; onAccept: () => void; onDecline: () => void }) {
  const { t } = useLang();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDecline}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20,26,51,0.5)' }}>
        <View testID="location-disclosure" style={{ backgroundColor: colors.ghee, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, padding: space.xl, gap: space.lg }}>
          <AppText variant="title">{t('location.disclosure.title')}</AppText>
          <AppText>{t('location.disclosure.body')}</AppText>
          <TapButton size="next" tone="left" label={t('location.disclosure.accept')} onConfirm={onAccept} testID="disclosure-accept" />
          <TapButton label={t('location.disclosure.decline')} onConfirm={onDecline} />
        </View>
      </View>
    </Modal>
  );
}
