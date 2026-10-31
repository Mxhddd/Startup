// Help, from the trip screen: tell every family why the van is late (one tap), or call 15 or 1122.
import { Linking, Modal, Pressable, View } from 'react-native';
import { useLang } from '../lang';
import { colors, radius, space } from '../theme';
import { AppText } from './AppText';
import { Icon } from './icons';
import { TapButton } from './TapButton';

export type LateReason = 'traffic' | 'breakdown' | 'roadClosed';

export function HelpSheet({ visible, onClose, onReason }: { visible: boolean; onClose: () => void; onReason: (reason: LateReason) => void }) {
  const { t, dir } = useLang();
  const reasons: LateReason[] = ['traffic', 'breakdown', 'roadClosed'];
  const call = (n: string) => Linking.openURL(`tel:${n}`);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20,26,51,0.5)' }}>
        <View testID="help-sheet" style={{ backgroundColor: colors.ghee, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, padding: space.xl, gap: space.md }}>
          <AppText variant="title">{t('help.late')}</AppText>
          {reasons.map((r) => (
            <TapButton key={r} label={t(`help.reason.${r}`)} onConfirm={() => onReason(r)} testID={`help-${r}`} />
          ))}
          <AppText variant="secondary">{t('help.note')}</AppText>
          <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', gap: space.md, marginTop: space.sm }}>
            {[
              { n: '15', label: t('help.police') },
              { n: '1122', label: t('help.rescue') },
            ].map((c) => (
              <Pressable
                key={c.n}
                testID={`call-${c.n}`}
                accessibilityRole="button"
                accessibilityLabel={`${c.label} ${c.n}`}
                onPress={() => call(c.n)}
                style={{ flex: 1, minHeight: 64, borderRadius: radius.button, backgroundColor: colors.shingarf, alignItems: 'center', justifyContent: 'center', flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', gap: 10 }}
              >
                <Icon name="phone" size={22} color={colors.white} />
                <AppText variant="number" color={colors.white} style={{ fontSize: 24, lineHeight: 30 }}>
                  {c.n}
                </AppText>
                <AppText bold color={colors.white}>
                  {c.label}
                </AppText>
              </Pressable>
            ))}
          </View>
          <Pressable accessibilityRole="button" onPress={onClose} style={{ minHeight: 56, alignItems: 'center', justifyContent: 'center' }}>
            <AppText bold color={colors.neel}>
              {t('help.close')}
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
