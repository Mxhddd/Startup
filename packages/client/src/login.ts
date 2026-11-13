// What the login screen needs from Supabase: send a code, check it, save the person's name.
// Parents also get their family made on first login (ensure_family, in the database).
import { backend } from './backend';

class NotConfigured extends Error {
  kind = 'notConfigured' as const;
}

function need() {
  if (!backend) throw new NotConfigured('notConfigured');
  return backend;
}

export function loginActions(role: 'parent' | 'driver', lang: 'ur' | 'en') {
  return {
    sendCode: async (phone: string) => {
      const { error } = await need().supabase.auth.signInWithOtp({ phone, options: { channel: 'sms' } });
      if (error) throw error;
    },
    verify: async (phone: string, code: string) => {
      const { supabase } = need();
      const { data, error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
      if (error) throw error;
      const uid = data.user?.id;
      if (!uid) throw new Error('no user');
      const { data: profile, error: readError } = await supabase.from('profiles').select('id').eq('id', uid).maybeSingle();
      if (readError) throw readError;
      return { needsName: !profile };
    },
    /**
     * v21: "Continue with Google" (free, no SMS). The phone's Google account gives an ID token; Supabase
     * checks it with Google and signs in (or creates) the account. Returns null if the person backed out.
     */
    google: googleAvailable()
      ? async (): Promise<{ needsName: boolean; name?: string } | null> => {
          const token = await googleIdToken();
          if (!token) return null;
          const { supabase } = need();
          const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: token.idToken });
          if (error) throw error;
          const uid = data.user?.id;
          if (!uid) throw new Error('no user');
          const { data: profile, error: readError } = await supabase.from('profiles').select('id').eq('id', uid).maybeSingle();
          if (readError) throw readError;
          const meta = (data.user?.user_metadata ?? {}) as { full_name?: string; given_name?: string; name?: string };
          return { needsName: !profile, name: (meta.given_name ?? meta.full_name ?? meta.name ?? '').slice(0, 40) };
        }
      : undefined,
    saveName: async (name: string) => {
      const { supabase } = need();
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (!uid) throw new Error('no user');
      const { error } = await supabase.from('profiles').insert({ id: uid, display_name: name, lang });
      if (error) throw error;
      if (role === 'parent') {
        const { error: famError } = await supabase.rpc('ensure_family');
        if (famError) throw famError;
      }
    },
  };
}

/** Forgets the login on this phone (after the account is deleted, the server already forgot it). */
export async function signOutHere(): Promise<void> {
  if (!backend) return;
  await backend.supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
}

/** Deletes this person's account and data on the server, then forgets the login here. */
export async function deleteMyAccount(): Promise<void> {
  await need().api('account.delete', { confirm: true });
  await signOutHere();
}

// v21: Google sign-in on Android. The native module is loaded only when it's used, so builds without it
// (tests, Expo Go) still run; the button only shows once the Google client ID is set for the build.
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
export const googleAvailable = (): boolean => GOOGLE_WEB_CLIENT_ID.length > 0;

type GoogleModule = {
  GoogleSignin: { configure: (o: { webClientId: string }) => void; hasPlayServices: (o?: { showPlayServicesUpdateDialog?: boolean }) => Promise<boolean>; signIn: () => Promise<{ type: string; data?: { idToken: string | null } | null }>; signOut: () => Promise<unknown> };
};
let configured = false;
async function googleIdToken(): Promise<{ idToken: string } | null> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { GoogleSignin } = require('@react-native-google-signin/google-signin') as GoogleModule;
  if (!configured) {
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
    configured = true;
  }
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const r = await GoogleSignin.signIn();
  if (r.type !== 'success' || !r.data?.idToken) return null;
  return { idToken: r.data.idToken };
}
