// Login: mobile number, the code from the SMS, and (first time) a name. See PhoneLogin in packages/ui.
import { loginActions, toLoginError } from '@pohnch/client';
import { useLang } from '@pohnch/ui';
import { PhoneLogin } from '@pohnch/ui/native';
import { router } from 'expo-router';
import { useMemo } from 'react';

export default function Login() {
  const { lang } = useLang();
  const actions = useMemo(() => loginActions('parent', lang), [lang]);
  return <PhoneLogin role="parent" {...actions} toError={toLoginError} onDone={() => router.replace('/')} />;
}
