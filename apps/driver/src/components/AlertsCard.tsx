// v9: on Today, once the van exists: why alerts help ("a family asks to join; your van is verified"),
// then the phone's permission prompt. Shown only while the phone hasn't been asked yet.
import { colors, space, useLang } from '@pohnch/ui';
import { AppText, Icon, TapButton } from '@pohnch/ui/native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { alertsAllowed, askDriverAlerts } from '../notifications/push';

export function AlertsCard() {
  const { t, dir } = useLang();
  const [show, setShow] = useState(false);
  useEffect(() => {
    alertsAllowed().then((s) => setShow(s === 'undecided')).catch(() => undefined);
  }, []);
  if (!show) return null;
  return (
    <Animated.View entering={FadeInDown.springify().damping(22).stiffness(300)} exiting={FadeOutUp.duration(240)} testID="alerts-card"
      style={{ backgroundColor: colors.neelTint, borderRadius: 28, borderCurve: 'continuous', padding: space.lg, gap: space.md }}>
      <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: space.md }}>
        <Icon name="bell" size={24} color={colors.link} />
        <AppText variant="headline" style={{ flex: 1 }}>{t('driver.alerts.title')}</AppText>
      </View>
      <AppText variant="secondary">{t('driver.alerts.body')}</AppText>
      <TapButton tone="left" icon="bell" label={t('driver.alerts.allow')} testID="alerts-allow"
        onConfirm={() => { askDriverAlerts(t('notify.channel.driver')).finally(() => setShow(false)); }} />
    </Animated.View>
  );
}
