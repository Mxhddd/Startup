// Login: mobile number, the code from the SMS, and (first time) a name. See PhoneLogin in packages/ui.
import { loginActions, toLoginError } from '@pohnch/client';
import { useLang } from '@pohnch/ui';
import { PhoneLogin } from '@pohnch/ui/native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo } from 'react';
import { WELCOME_SEEN } from '../state/welcome';

export default function Login() {
  const { lang } = useLang();
  const actions = useMemo(() => loginActions('parent', lang), [lang]);
  // First time on this phone: the three welcome screens come first.
  useEffect(() => {
    AsyncStorage.getItem(WELCOME_SEEN)
      .then((seen) => {
        if (!seen) router.replace('/welcome');
      })
      .catch(() => undefined);
  }, []);
  return (
    <>
      <StatusBar style="light" />
      <PhoneLogin role="parent" {...actions} toError={toLoginError} onDone={() => router.replace('/')} />
    </>
  );
}
