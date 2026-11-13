// Opened from a parent's "invite my driver" link (pohnch-driver://i/<token>, via the pohnch.pk page).
// The family's request is added to this driver's van; the driver then approves it on the Families screen.
// The token is used once here and never stored or logged.
import { driver } from '@pohnch/client';
import { ApiError } from '@pohnch/core';
import { colors, useLang } from '@pohnch/ui';
import { AppText, TapButton } from '@pohnch/ui/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Screen } from '../../components/Screen';
import { useDriver } from '../../state/DriverStore';

export default function FamilyInvite() {
  const { t } = useLang();
  const d = useDriver();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const valid = typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token);

  const accept = async () => {
    if (!d.van || !valid) return;
    try {
      await driver.driverApi.acceptFamilyInvite(token, d.van.id);
      await d.actions.refresh();
      setMsg({ ok: true, text: t('driver.invite.done') });
      setTimeout(() => router.replace('/families'), 300);
    } catch (e) {
      setMsg({ ok: false, text: e instanceof ApiError && e.code === 'invite_invalid' ? t('driver.invite.bad') : t('error.generic') });
    }
  };

  return (
    <Screen title={t('driver.invite.title')}>
      {!valid ? (
        <AppText color={colors.dangerText}>{t('driver.invite.bad')}</AppText>
      ) : !d.van ? (
        <>
          <AppText variant="secondary">{t('driver.invite.needVan')}</AppText>
          <TapButton size="next" tone="left" label={t('driver.today.setup')} onConfirm={() => router.push('/setup')} />
        </>
      ) : (
        <>
          <AppText variant="secondary">{t('driver.invite.body')}</AppText>
          {msg ? <AppText color={msg.ok ? colors.zamurradOnTint : colors.dangerText}>{msg.text}</AppText> : null}
          <TapButton size="next" tone="picked" label={t('driver.invite.accept')} onConfirm={accept} testID="accept-family-invite" />
        </>
      )}
    </Screen>
  );
}
