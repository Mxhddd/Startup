// Login: mobile number, the code from the SMS, and (first time) a name. See PhoneLogin in packages/ui.
import { loginActions, toLoginError } from '@pohnch/client';
import { useLang } from '@pohnch/ui';
import { PhoneLogin } from '@pohnch/ui/native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';

export default function Login() {
  const { lang } = useLang();
  const actions = useMemo(() => loginActions('parent', lang), [lang]);
  // (v21: whether Welcome comes first is decided in the root layout, before anything is drawn.)
  return (
    <>
      <StatusBar style="light" />
      <PhoneLogin role="parent" {...actions} toError={toLoginError} onDone={() => router.replace('/')} />
    </>
  );
}
