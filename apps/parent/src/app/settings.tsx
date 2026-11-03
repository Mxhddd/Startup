// Notification settings (v7): which trip alerts reach this phone, Pohnch's own sounds (with a way to
// hear them), the language alerts are written in, and a way into the phone's settings when Pohnch's
// notifications are switched off there. The map and timeline always show everything.
//
// Data: notification_prefs (one row per person, private by row-level security). The server's
// push_recipients reads it, so a switched-off step simply never sends a push to this phone.
import { parent } from '@pohnch/client';

type NotificationPrefs = Awaited<ReturnType<typeof parent.notificationPrefs>>;
import { ALERT_STEPS, MOMENTS, type MomentStep } from '@pohnch/core';
import { colors, radius, space, useLang } from '@pohnch/ui';
import { AppText, ChoiceChip, PressableScale, Shimmer, Toggle } from '@pohnch/ui/native';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Linking, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Page } from '../components/Page';
import { alertsUndecided, askForAlerts, previewSound, registerForPush } from '../notifications/setup';

const TONE = { neel: colors.neel, zamurrad: colors.zamurrad, kesar: colors.kesar, shingarf: colors.shingarf } as const;

function Row({ children, last = false }: { children: ReactNode; last?: boolean }) {
  const { dir } = useLang();
  return <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 14, minHeight: 60, borderBottomWidth: last ? 0 : 1, borderColor: colors.hairline }}>{children}</View>;
}

export default function Settings() {
  const { t, lang, toggle } = useLang();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [allowed, setAllowed] = useState(true);
  const [undecided, setUndecided] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    parent.notificationPrefs().then(setPrefs).catch(() => setPrefs({ offSteps: [], sound: true }));
    Notifications.getPermissionsAsync().then((p) => setAllowed(p.status === 'granted')).catch(() => undefined);
    alertsUndecided().then(setUndecided).catch(() => undefined);
  }, []);

  // Save shortly after the last change, so flicking several switches sends one write.
  const update = (next: NotificationPrefs) => {
    setPrefs(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => parent.saveNotificationPrefs(next).catch(() => undefined), 500);
  };

  const setStep = (s: MomentStep, on: boolean) => {
    if (!prefs) return;
    const off = new Set(prefs.offSteps);
    if (on) off.delete(s);
    else off.add(s);
    update({ ...prefs, offSteps: ALERT_STEPS.filter((x) => off.has(x)) });
  };

  const setLanguage = (l: 'ur' | 'en') => {
    if (l !== lang) toggle();
    parent.setAlertLanguage(l).catch(() => undefined);
  };

  return (
    <Page title={t('settings.title')}>
      <AppText variant="secondary">{t('settings.hint')}</AppText>

      {!allowed ? (
        <Animated.View entering={FadeInDown.springify()} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.card, borderCurve: 'continuous', backgroundColor: colors.kesarTint }}>
          <AppText bold style={{ flex: 1 }}>{t('settings.off')}</AppText>
          <PressableScale accessibilityRole="button" testID="alerts-allow"
            onPress={() => (undecided ? askForAlerts().then((ok) => { setAllowed(ok); setUndecided(false); if (ok) registerForPush().catch(() => undefined); }) : Linking.openSettings())} faceStyle={{ height: 44, paddingHorizontal: 16, borderRadius: 14, borderCurve: 'continuous', backgroundColor: colors.siyahi, justifyContent: 'center' }}>
            <AppText bold color={colors.ghee}>{undecided ? t('welcome.allow') : t('settings.open')}</AppText>
          </PressableScale>
        </Animated.View>
      ) : null}

      <AppText bold color={colors.ink2} style={{ fontSize: 14, marginTop: space.sm }}>{t('settings.steps')}</AppText>
      {!prefs ? (
        <Shimmer lines={ALERT_STEPS.map(() => ({ w: '100%', h: 44 }))} />
      ) : (
        <Animated.View entering={FadeIn.duration(250)}>
          {ALERT_STEPS.map((s, i) => (
            <Row key={s} last={i === ALERT_STEPS.length - 1}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: TONE[MOMENTS[s].tone] }} />
              <View style={{ flex: 1 }}>
                <AppText bold style={{ fontSize: 17 }}>{t(`settings.step.${s}`)}</AppText>
                {MOMENTS[s].timeSensitive ? <AppText variant="small" color={colors.ink2}>{t('settings.focus')}</AppText> : null}
              </View>
              <Toggle value={!prefs.offSteps.includes(s)} onChange={(on) => setStep(s, on)} label={t(`settings.step.${s}`)} testID={`alert-${s}`} />
            </Row>
          ))}
        </Animated.View>
      )}

      <AppText bold color={colors.ink2} style={{ fontSize: 14, marginTop: space.lg }}>{t('settings.sound')}</AppText>
      <View>
        <Row>
          <View style={{ flex: 1 }}>
            <AppText bold style={{ fontSize: 17 }}>{t('settings.sound.brand')}</AppText>
            <AppText variant="small" color={colors.ink2}>{t('settings.sound.hint')}</AppText>
          </View>
          {prefs ? <Toggle value={prefs.sound} onChange={(v) => update({ ...prefs, sound: v })} label={t('settings.sound.brand')} testID="alert-sound" /> : null}
        </Row>
        <Row last>
          {(['chime', 'pohnch'] as const).map((k) => (
            <PressableScale key={k} accessibilityRole="button" onPress={() => previewSound(k, t(k === 'chime' ? 'settings.sound.chime' : 'settings.sound.pohnch')).catch(() => undefined)} style={{ flex: 1 }}
              faceStyle={{ height: 48, borderRadius: radius.pill, backgroundColor: colors.neelTint, alignItems: 'center', justifyContent: 'center' }} testID={`hear-${k}`}>
              <AppText bold color={colors.neel}>{t(k === 'chime' ? 'settings.sound.chime' : 'settings.sound.pohnch')}</AppText>
            </PressableScale>
          ))}
        </Row>
      </View>

      <AppText bold color={colors.ink2} style={{ fontSize: 14, marginTop: space.lg }}>{t('settings.language')}</AppText>
      <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
        <ChoiceChip label="اردو" on={lang === 'ur'} onPress={() => setLanguage('ur')} />
        <ChoiceChip label="English" on={lang === 'en'} onPress={() => setLanguage('en')} />
      </View>
    </Page>
  );
}
