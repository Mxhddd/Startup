// v24: once per login on this phone, link a website sign-up with the same number to this account, and
// open the WhatsApp-number screen if the team has no way to reach this person (Google sign-in).
import { places } from '@pohnch/client';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';

export function AfterLogin({ userId }: { userId: string | null }) {
  const done = useRef<string | null>(null);
  useEffect(() => {
    if (!userId || done.current === userId) return;
    done.current = userId;
    places
      .afterLogin()
      .then(({ needsPhone }) => {
        if (needsPhone) setTimeout(() => router.push('/contact'), 1200);
      })
      .catch(() => undefined);
  }, [userId]);
  return null;
}
