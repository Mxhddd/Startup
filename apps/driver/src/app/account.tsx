// Help and account (v8): message the Pohnch team on WhatsApp, read the privacy policy, or delete the
// account (Apple and Google require deleting from inside the app).
// A driver whose van still has families is asked to remove them first (Families screen), or to message
// Pohnch to hand the van to another driver: the families must never lose their van without being told.
// Data: deleting goes through the "app" Edge Function (account.delete), which checks the van first.
import { deleteMyAccount } from '@pohnch/client';
import { ApiError, PILOT_WHATSAPP } from '@pohnch/core';
import { colors, radius, space, useLang } from '@pohnch/ui';
import { AppText, EditSheet, TapButton, Toggle, soundsAreOn } from '@pohnch/ui/native';
import { saveSounds } from '../sounds';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';
import { Screen } from '../components/Screen';
import { useDriver } from '../state/DriverStore';

const PRIVACY_URL = 'https://pohnch.pk/privacy';

export default function Account() {
  const { t } = useLang();
  const d = useDriver();
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFamilies = d.riders.length > 0;
  const [sounds, setSounds] = useState(soundsAreOn());

  const remove = async () => {
    setError(null);
    try {
      await deleteMyAccount();
      setAsking(false);
      router.replace('/login');
    } catch (e) {
      setError(e instanceof ApiError && e.code === 'van_has_families' ? t('driver.account.hasFamilies') : t('error.generic'));
    }
  };

  return (
    <Screen title={t('driver.account.title')}>
      <AppText variant="secondary" style={{ fontSize: 17 }}>{t('driver.account.helpBody')}</AppText>
      <TapButton size="next" tone="picked" icon="phone" label={t('parent.menu.whatsapp', { phone: PILOT_WHATSAPP.display })}
        onConfirm={() => Linking.openURL(`https://wa.me/${PILOT_WHATSAPP.waNumber}`)} testID="help-whatsapp" />
      <TapButton tone="quiet" label={t('parent.menu.privacy')} onConfirm={() => Linking.openURL(PRIVACY_URL)} testID="help-privacy" />

      {/* v9: the trip's sounds (a tone for each tap, a rising tick while holding). */}
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: space.md, minHeight: 64 }}>
        <View style={{ flex: 1 }}>
          <AppText bold style={{ fontSize: 17 }}>{t('settings.sound.app')}</AppText>
          <AppText variant="small" color={colors.ink2}>{t('driver.account.soundsHint')}</AppText>
        </View>
        <Toggle value={sounds} onChange={(v) => { setSounds(v); void saveSounds(v); }} label={t('settings.sound.app')} testID="app-sounds" />
      </View>

      <View style={{ height: 1, backgroundColor: colors.hairline, marginVertical: space.md }} />
      <TapButton tone="quiet" label={t('parent.menu.delete')} onConfirm={() => { setError(null); setAsking(true); }} testID="account-delete" />

      <EditSheet visible={asking} title={t('parent.menu.deleteTitle')} onClose={() => setAsking(false)} testID="delete-sheet">
        {hasFamilies ? (
          <View style={{ backgroundColor: colors.kesarTint, borderRadius: radius.card, borderCurve: 'continuous', padding: space.lg, gap: space.md }}>
            <AppText bold>{t('driver.account.hasFamilies')}</AppText>
            <TapButton tone="neutral" icon="family" label={t('driver.nav.families')} onConfirm={() => { setAsking(false); router.push('/families'); }} />
          </View>
        ) : (
          <>
            <AppText variant="secondary">{t('driver.account.deleteBody')}</AppText>
            {error ? <AppText color={colors.dangerText}>{error}</AppText> : null}
            <TapButton hold tone="quiet" label={t('parent.menu.deleteConfirm')} onConfirm={remove} testID="delete-confirm" />
          </>
        )}
      </EditSheet>
    </Screen>
  );
}
