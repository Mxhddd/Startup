// Help, from the trip screen: tell every family why the van is late (one tap), or call 15 or 1122.
// The screen behind dims while the sheet rises on the sheet spring; closing reverses it.
import { useEffect, useState } from 'react';
import { Linking, Modal, Pressable, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useLang } from '../lang';
import { springs } from '../motion';
import { colors, radius, space } from '../theme';
import { AppText } from './AppText';
import { Icon } from './icons';
import { PressableScale } from './PressableScale';
import { TapButton } from './TapButton';

export type LateReason = 'traffic' | 'breakdown' | 'roadClosed';

export function HelpSheet({ visible, onClose, onReason, onEmergency }: {
  visible: boolean;
  onClose: () => void;
  onReason: (reason: LateReason) => void;
  /** v10 stage 2 (only when switched on): a hold that tells the Pohnch team, with the van's last position. */
  onEmergency?: () => Promise<boolean>;
}) {
  const [sent, setSent] = useState(false);
  const { t, dir } = useLang();
  const reasons: LateReason[] = ['traffic', 'breakdown', 'roadClosed'];
  const call = (n: string) => Linking.openURL(`tel:${n}`);
  const [mounted, setMounted] = useState(visible);
  const shown = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      shown.value = withSpring(1, springs.sheet);
    } else if (mounted) {
      shown.value = withTiming(0, { duration: 220 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const scrim = useAnimatedStyle(() => ({ opacity: shown.value }));
  const sheet = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - shown.value) * 520 }] }));

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim }, scrim]}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('help.close')} style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>
        <Animated.View testID="help-sheet" style={[{ backgroundColor: colors.ghee, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, padding: space.xl, paddingTop: space.md, gap: space.md }, sheet]}>
          <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 3, borderCurve: 'continuous', backgroundColor: colors.line, marginBottom: space.sm }} />
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
              <PressableScale
                key={c.n}
                testID={`call-${c.n}`}
                accessibilityRole="button"
                accessibilityLabel={`${c.label} ${c.n}`}
                onPress={() => call(c.n)}
                haptic="press"
                lip={{ color: colors.shingarfDeep, depth: 4 }}
                style={{ flex: 1 }}
                faceStyle={{ minHeight: 64, borderRadius: radius.card, borderCurve: 'continuous', backgroundColor: colors.shingarf, alignItems: 'center', justifyContent: 'center', flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', gap: 10 }}
              >
                <Icon name="phone" size={22} color={colors.onFill} />
                <AppText variant="number" color={colors.onFill} style={{ fontSize: 24, lineHeight: 30 }}>
                  {c.n}
                </AppText>
                <AppText bold color={colors.onFill}>
                  {c.label}
                </AppText>
              </PressableScale>
            ))}
          </View>
          {onEmergency ? (
            <View style={{ marginTop: space.sm, padding: space.lg, gap: space.md, borderRadius: 28, borderCurve: 'continuous', backgroundColor: colors.shingarfTint }} testID="help-emergency">
              <AppText bold color={colors.dangerText} style={{ fontSize: 18 }}>{t('s2.help.title')}</AppText>
              {sent ? (
                <AppText bold color={colors.dangerText} testID="help-emergency-sent">{t('s2.help.sent')}</AppText>
              ) : (
                <>
                  <AppText color={colors.dangerText}>{t('s2.help.body')}</AppText>
                  <TapButton size="next" tone="help" hold icon="help" label={t('s2.help.hold')} onConfirm={async () => setSent(await onEmergency())} testID="help-emergency-hold" />
                </>
              )}
            </View>
          ) : null}
          <PressableScale accessibilityRole="button" onPress={onClose} faceStyle={{ minHeight: 56, alignItems: 'center', justifyContent: 'center' }}>
            <AppText bold color={colors.link}>
              {t('help.close')}
            </AppText>
          </PressableScale>
        </Animated.View>
      </View>
    </Modal>
  );
}
