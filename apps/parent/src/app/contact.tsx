// v24: asked once after a Google sign-in (those accounts have no phone number), so the Pohnch team can
// reach this person on WhatsApp. The number goes to contact_phones, which only the person and the team
// can read. "Not now" skips it until the next app start.
import { places } from '@pohnch/client';
import { normalisePkMobile } from '@pohnch/core';
import { colors, space, useLang } from '@pohnch/ui';
import { AppText, TapButton, TextField } from '@pohnch/ui/native';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Page } from '../components/Page';

export default function Contact() {
  const { t } = useLang();
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const save = async () => {
    const e164 = normalisePkMobile(phone);
    if (!e164) return setMsg(t('contact.bad'));
    try {
      await places.setContactPhone(e164);
      leave();
    } catch {
      setMsg(t('error.generic'));
    }
  };
  return (
    <Page title={t('contact.title')}>
      <View style={{ gap: space.md, padding: space.lg }}>
        <AppText variant="secondary">{t('contact.hint')}</AppText>
        <TextField label={t('contact.title')} value={phone} onChange={setPhone} ltr maxLength={16} testID="contact-phone" />
        {msg ? <AppText bold color={colors.dangerText}>{msg}</AppText> : null}
        <TapButton tone="left" icon="check" label={t('contact.save')} onConfirm={save} testID="contact-save" />
        <TapButton tone="quiet" label={t('welcome.notNow')} onConfirm={leave} testID="contact-later" />
      </View>
    </Page>
  );
}
