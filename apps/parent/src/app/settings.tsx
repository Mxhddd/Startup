// Notification settings (v7): which trip alerts reach this phone, Pohnch's own sounds (with a way to
// hear them), the language alerts are written in, and a way into the phone's settings when Pohnch's
// notifications are switched off there. The map and timeline always show everything.
//
// Data: notification_prefs (one row per person, private by row-level security). The server's
// push_recipients reads it, so a switched-off step simply never sends a push to this phone.
import { parent } from '@pohnch/client';

type NotificationPrefs = Awaited<ReturnType<typeof parent.notificationPrefs>>;
import { ALERT_STEPS, MOMENTS, type MomentStep } from '@pohnch/core';
import { colors, radius, useLang } from '@pohnch/ui';
import { AppText, Group, GroupRow, PressableScale, RowIcon, SectionCaption, Segmented, Shimmer, Toggle, feel, soundsAreOn, type IconName } from '@pohnch/ui/native';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Linking, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Page } from '../components/Page';
import { alertsUndecided, askForAlerts, registerForPush } from '../notifications/setup';
import { saveSounds } from '../sounds';
import { bigTextOn, setBigText } from '../textSize';
import { DEFAULT_LOCAL, localPrefs, PREP_CHOICES, saveLocalPrefs, type LocalPrefs } from '../notifications/localPrefs';

const TONE = { neel: colors.neel, zamurrad: colors.zamurrad, kesar: colors.kesar, shingarf: colors.shingarf } as const;

/** v10: each step's two-tone icon, in its meaning's tint. */
const STEP_ICON: Record<MomentStep, IconName> = { left: 'left', arriving: 'pin', picked: 'picked', reached_school: 'reachedSchool', left_school: 'leftSchool', dropped: 'dropped', late: 'help' };
function stepTint(s: MomentStep) {
  const tone = MOMENTS[s].tone;
  if (tone === 'zamurrad') return { tint: colors.zamurradTint, ink: colors.zamurradOnTint };
  if (tone === 'kesar') return { tint: colors.kesarTint, ink: colors.onKesar };
  if (tone === 'shingarf') return { tint: colors.shingarfTint, ink: colors.dangerText };
  return { tint: colors.neelTint, ink: colors.link };
}

export default function Settings() {
  const { t, lang, toggle, dir } = useLang();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [allowed, setAllowed] = useState(true);
  const [undecided, setUndecided] = useState(false);
  const [appSounds, setAppSounds] = useState<boolean | null>(() => soundsAreOn());
  const [playing, setPlaying] = useState<MomentStep | null>(null);
  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => setPlaying(null), 1400);
    return () => clearTimeout(id);
  }, [playing]);
  const [local, setLocal] = useState<LocalPrefs>(DEFAULT_LOCAL);
  const [big, setBig] = useState(bigTextOn());
  useEffect(() => {
    localPrefs().then(setLocal);
  }, []);
  const setLocalPref = (next: LocalPrefs) => {
    setLocal(next);
    void saveLocalPrefs(next);
  };
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
    <Page title={t('settings.title')} sub={t('settings.hint')}>

      {!allowed ? (
        <Animated.View entering={FadeInDown.springify().damping(22).stiffness(300)} style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 28, borderCurve: 'continuous', backgroundColor: colors.kesarTint }}>
          <AppText bold style={{ flex: 1 }}>{t('settings.off')}</AppText>
          <PressableScale accessibilityRole="button" testID="alerts-allow"
            onPress={() => (undecided ? askForAlerts().then((ok) => { setAllowed(ok); setUndecided(false); if (ok) registerForPush().catch(() => undefined); }) : Linking.openSettings())} faceStyle={{ height: 44, paddingHorizontal: 16, borderRadius: 14, borderCurve: 'continuous', backgroundColor: colors.night, justifyContent: 'center' }}>
            <AppText bold color={colors.onBrand}>{undecided ? t('welcome.allow') : t('settings.open')}</AppText>
          </PressableScale>
        </Animated.View>
      ) : null}

      <SectionCaption>{t('settings.steps')}</SectionCaption>
      {!prefs ? (
        <Shimmer lines={ALERT_STEPS.map(() => ({ w: '100%', h: 44 }))} />
      ) : (
        <Animated.View entering={FadeIn.duration(250)}>
          <Group>
            {ALERT_STEPS.map((s) => {
              const c = stepTint(s);
              return (
                <GroupRow key={s} title={t(`settings.step.${s}`)} sub={MOMENTS[s].timeSensitive ? t('settings.focus') : null}
                  lead={<RowIcon name={STEP_ICON[s]} tint={c.tint} ink={c.ink} />}
                  trail={<Toggle value={!prefs.offSteps.includes(s)} onChange={(on) => setStep(s, on)} label={t(`settings.step.${s}`)} testID={`alert-${s}`} />} />
              );
            })}
          </Group>
        </Animated.View>
      )}

      <SectionCaption>{t('settings.sound')}</SectionCaption>
      <Group>
        <GroupRow title={t('settings.sound.brand')} sub={t('settings.sound.hint')} lead={<RowIcon name="bell" />}
          trail={prefs ? <Toggle value={prefs.sound} onChange={(v) => update({ ...prefs, sound: v })} label={t('settings.sound.brand')} testID="alert-sound" /> : null} />
        <GroupRow title={t('settings.sound.app')} sub={t('settings.sound.appHint')} lead={<RowIcon name="sound" />}
          trail={appSounds !== null ? <Toggle value={appSounds} onChange={(v) => { setAppSounds(v); void saveSounds(v); }} label={t('settings.sound.app')} testID="app-sounds" /> : null} />
      </Group>

      {/* v12: alerts this phone makes by itself. */}
      <SectionCaption>{t('settings.prep.title')}</SectionCaption>
      <AppText variant="secondary">{t('settings.prep.body')}</AppText>
      <Segmented testID="prep-minutes" items={PREP_CHOICES.map((m) => ({ key: String(m), label: m === 0 ? t('settings.prep.off') : t('settings.prep.min', { min: m }) }))}
        value={String(local.prep)} onChange={(v) => setLocalPref({ ...local, prep: Number(v) })} />
      <Group>
        <GroupRow title={t('settings.friday.title')} sub={t('settings.friday.hint')} lead={<RowIcon name="star" />}
          trail={<Toggle value={local.friday} onChange={(v) => setLocalPref({ ...local, friday: v })} label={t('settings.friday.title')} testID="friday-toggle" />} />
        <GroupRow title={t('settings.brief.title')} sub={t('settings.brief.hint')} lead={<RowIcon name="calendar" />}
          trail={<Toggle value={local.brief} onChange={(v) => setLocalPref({ ...local, brief: v })} label={t('settings.brief.title')} testID="brief-toggle" />} />
      </Group>

      {/* v9: every step's tone, to hear before it comes (the alert is its longer twin). */}
      <SectionCaption>{t('settings.sound.board')}</SectionCaption>
      <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 8 }}>
        {ALERT_STEPS.map((s) => (
          <PressableScale key={s} accessibilityRole="button" accessibilityLabel={`${t('settings.sound.hear')} ${t(`settings.step.${s}`)}`} haptic="none"
            onPress={() => { feel(s); setPlaying(s); }} testID={`hear-${s}`}
            faceStyle={{ minHeight: 48, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: playing === s ? TONE[MOMENTS[s].tone] : colors.white, boxShadow: playing === s ? undefined : '0px 1px 1px rgba(31,42,92,0.04), 0px 4px 10px rgba(31,42,92,0.05)', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: playing === s ? colors.onBrand : TONE[MOMENTS[s].tone] }} />
            <AppText bold color={playing === s ? (MOMENTS[s].tone === 'kesar' ? colors.onKesar : colors.onBrand) : colors.link} style={{ fontSize: 15 }}>{t(`settings.step.${s}`)}</AppText>
          </PressableScale>
        ))}
      </View>

      {/* v12: bigger text everywhere. */}
      <Group>
        <GroupRow title={t('settings.bigText.title')} sub={t('settings.bigText.hint')} lead={<RowIcon name="search" />}
          trail={<Toggle value={big} onChange={(v) => { setBig(v); setBigText(v); }} label={t('settings.bigText.title')} testID="big-text" />} />
      </Group>

      <SectionCaption>{t('settings.language')}</SectionCaption>
      <Segmented testID="alert-language" items={[{ key: 'ur', label: 'اردو' }, { key: 'en', label: 'English' }]} value={lang} onChange={(l) => setLanguage(l)} />
    </Page>
  );
}
